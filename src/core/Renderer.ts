import { GUI } from 'dat.gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Font } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import isEmpty from 'lodash.isempty';
import range from 'lodash.range';

import fontJson from '../assets/fonts/font.json';
import { changeSize, getRandomColor } from '../lib';

import type { AvailableValue, ValidatedData } from './Validator';

interface PerspectiveCameraOptions {
  fov: number;
  aspect: number;
  near: number;
  far: number;
}

interface SizeOf2d {
  width: number;
  height: number;
}

interface SizeOf3d extends SizeOf2d {
  depth: number;
}

interface Position {
  x: number;
  y: number;
  z: number;
}

interface Style {
  color: string;
  opacity?: number;
  transparent?: boolean;
}

interface CubeOptions extends SizeOf3d, Position, Style { }

interface TextOptions extends Position, Style, Partial<SizeOf3d> {
  value: AvailableValue | ValidatedData;
}

enum GUIFolders {
  Camera_Position = 'Camera Position',
  Root_Cube = "Root Cube - Click 'Render' button again"
}

export default class Renderer {
  private $canvas: HTMLCanvasElement;
  private $renderer: THREE.WebGLRenderer;
  private $font: Font;
  private $gui: GUI;
  private $controls: OrbitControls;
  private $perspectiveCamera: THREE.PerspectiveCamera;
  private $scene: THREE.Scene;
  private $rootInstance: SizeOf3d = {} as SizeOf3d;

  constructor() {
    this.setCanvas();

    this.setRenderer();

    this.setRootInstance({
      width: 10,
      height: 10,
      depth: 10
    });

    this.setFont();

    this.setGUI();

    this.setPerspectiveCamera({
      // Reference: https://www.youtube.com/watch?v=Oe4n0vyrSiU
      fov: 75,
      aspect: 2,
      near: 0.1,
      far: 2500
    }, {
      x: 0,
      y: 10,
      z: 50
    });

    this.setOrbitControls({
      x: 0,
      y: 0,
      z: 0
    });

    this.setControlsEventListener();
    this.setResizeEventListener();
  }

  public render(data: ValidatedData) {
    const numberOfData = data.length;
    const cubeLength = this.$rootInstance.width;

    // Scene and Light
    this.setScene(numberOfData, cubeLength);
    this.setLight(numberOfData, cubeLength);

    // Render
    this.addInstances(data, cubeLength, 0, 1);
    this.renderScene();

    // GUI Setting
    this.$gui.show();
    this.setGUIFolders();
  }

  private getColor(color: string) {
    return new THREE.Color(color);
  }

  private checkIsRendererNeedResize() {
    const rendererCanvas = this.$renderer.domElement;
    const currentCanvasWidth = this.$canvas.clientWidth;
    const currentCanvasHeight = this.$canvas.clientHeight;

    return rendererCanvas.width !== currentCanvasWidth
      || rendererCanvas.height !== currentCanvasHeight;
  }

  private setCanvas() {
    this.$canvas = document.getElementById('canvas') as HTMLCanvasElement;
  }

  private setRenderer() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.$canvas,
      alpha: true
    });

    this.$renderer = renderer;
  }

  private setRootInstance(size: Partial<SizeOf3d>) {
    this.$rootInstance = {
      ...this.$rootInstance,
      ...size
    };
  }

  private setFont() {
    this.$font = new Font(fontJson);
  }

  private setGUI() {
    this.$gui = new GUI();
    this.$gui.hide();
  }

  private setGUIFolders() {
    const folders = this.$gui.__folders;

    // Camera Postion - x, y, z
    if (!folders.hasOwnProperty(GUIFolders.Camera_Position)) {
      const cameraPosition = this.$gui.addFolder(GUIFolders.Camera_Position);

      cameraPosition.add(this.$perspectiveCamera.position, 'x', -100, 500, 0.5)
        .onChange(this.renderScene.bind(this))
        .listen();

      cameraPosition.add(this.$perspectiveCamera.position, 'y', -100, 500, 0.5)
        .onChange(this.renderScene.bind(this))
        .listen();

      cameraPosition.add(this.$perspectiveCamera.position, 'z', 0, 2500, 1)
        .onChange(this.renderScene.bind(this))
        .listen();

      cameraPosition.open();
    }

    // Root Cube length
    if (!folders.hasOwnProperty(GUIFolders.Root_Cube)) {
      const rootCube = this.$gui.addFolder(GUIFolders.Root_Cube);

      rootCube.add(this.$rootInstance, 'width', 1, 150, 1)
        // @TODO: Make instances responsive to width.
        .onChange(this.setRootInstance)
        .listen();

      rootCube.open();
    }
  }

  private setPerspectiveCamera(options: PerspectiveCameraOptions, position: Position) {
    this.$perspectiveCamera = new THREE.PerspectiveCamera(
      options.fov,
      options.aspect,
      options.near,
      options.far
    );

    this.$perspectiveCamera.position.x = position.x;
    this.$perspectiveCamera.position.y = position.y;
    this.$perspectiveCamera.position.z = position.z;
  }

  private setOrbitControls(position: Position, enableDamping?: boolean) {
    this.$controls = new OrbitControls(
      this.$perspectiveCamera,
      this.$canvas
    );

    this.$controls.target.set(position.x, position.y, position.z);

    // Smooth Moving
    if (enableDamping) {
      this.$controls.enableDamping = true;
    }

    this.$controls.update();
  }

  private setScene(numberOfData: number, cubeLength: number) {
    this.$scene = new THREE.Scene();
    this.$scene.background = this.getColor('#fff');

    // Change x axis to see the middle of scene.
    // Ignore gap of each cube. (Not that important..? :D)
    const xAxisToMove = -1 * Math.floor(numberOfData * cubeLength / 2);

    this.$scene.translateX(xAxisToMove);
  }

  private setLight(numberOfData: number, cubeLength: number) {
    const lightBuffer = cubeLength * 4.5;

    const totalSize = numberOfData * cubeLength;

    // To shoot periodic light.
    range(Math.ceil(totalSize / lightBuffer))
      .forEach(index => {
        const xPosToSetLight = index * lightBuffer;

        this.addLight({
          x: xPosToSetLight,
          y: cubeLength,
          z: Math.floor(cubeLength / 2)
        });
      });
  }

  private addLight(position: Position) {
    const color = 0xFFFFFF;
    const intensity = 1;

    // Reference: https://dev-t-blog.tistory.com/23
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(position.x, position.y, position.z);

    this.$scene.add(light);
  }

  private addInstances(data: ValidatedData, parentWidth: number, parentX: number, dimension: number) {
    if (isEmpty(data)) {
      return;
    }

    const color = getRandomColor();

    data.forEach((value, index) => {
      const width = parentWidth;
      // @TODO: Support cuboid.
      const height = width, depth = width;

      const gap = width / 10;
      const x = parentX + index * (width + gap);

      if (Array.isArray(value)) {
        const innerCubeLength = value.length;
        const ratio = innerCubeLength === 1
          ? 0.8
          : 0.9;
        const dividedWidth = changeSize(width / innerCubeLength, ratio);
        
        this.addInstances(
          value,
          dividedWidth,
          x + (gap / innerCubeLength),
          dimension + 1
        );
      }

      const baseOpacity = 0.15;
      const opacity = dimension === 1
        ? baseOpacity
        : baseOpacity + (dimension * 0.05);

      this.makeCubeInstance({
        width,
        height,
        depth,
        color,
        opacity,
        transparent: true,
        x,
        y: 0,
        z: 0
      });
      this.makeTextInstance({
        color: '#202020',
        width,
        x,
        y: 0,
        z: 0,
        value
      });
    });
  }

  private makeCubeInstance(options: CubeOptions) {
    const boxWidth = options.width;
    const boxHeight = options.height;
    const boxDepth = options.depth;
    const cubeGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // Change axis position of cube so that it comes to the starting point of the axis.
    cubeGeometry.translate(options.width / 2, 0, 0);

    [THREE.BackSide, THREE.FrontSide].forEach((side) => {
      const cubeMaterial = new THREE.MeshPhongMaterial({
        color: options.color,
        opacity: options.opacity,
        transparent: options.transparent,
        side,
      });

      // Reference: https://discourse.threejs.org/t/threejs-and-the-transparent-problem/11553/28
      cubeMaterial.depthWrite = false;

      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

      cube.position.set(options.x, options.y, options.z);

      this.$scene.add(cube);
    });
  }

  private makeTextInstance(options: TextOptions) {
    if (!options.value || Array.isArray(options.value)) {
      return;
    }

    const value = typeof options.value === 'string'
      ? options.value
      : options.value.toString();

    const fontSize = options.width! / (value.length === 1
        ? 2
        : value.length
      );
    const fontHeight = 0.05;

    const textGeometry = new TextGeometry(value, {
      font: this.$font,
      size: fontSize,
      height: fontHeight
    });

    textGeometry.center();
    textGeometry.translate(options.width / 2, 0, 0);

    const textMaterial = new THREE.MeshBasicMaterial({
      color: options.color
    });

    const text = new THREE.Mesh(textGeometry, textMaterial);

    text.position.set(options.x, options.y, options.z);

    this.$scene.add(text);
  }

  private renderScene() {
    if (this.checkIsRendererNeedResize()) {
      const currentCanvasWidth = this.$canvas.clientWidth;
      const currentCanvasHeight = this.$canvas.clientHeight;

      this.$renderer.setSize(currentCanvasWidth, currentCanvasHeight);

      this.$perspectiveCamera.aspect = currentCanvasWidth / currentCanvasHeight;
      this.$perspectiveCamera.updateProjectionMatrix();
    }

    const isRendered = this.$scene !== undefined;

    if (isRendered) {
      this.$renderer.render(
        this.$scene,
        this.$perspectiveCamera
      );
    }
  }

  private setControlsEventListener() {
    this.$controls.addEventListener('change', this.renderScene.bind(this));
  }

  private setResizeEventListener() {
    window.addEventListener('resize', this.renderScene.bind(this));
  }
}
