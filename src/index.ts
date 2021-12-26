import { js as beautify } from 'js-beautify';

import Renderer from './core/Renderer';
import Validator, { ValidatedData } from './core/Validator';

const renderBtn = document.getElementById('render-btn');
const arrayInfoArea = document.getElementById('array-info') as HTMLTextAreaElement;
const mouseInfo = document.getElementById('mouse-info');

const renderer = new Renderer();

renderBtn.addEventListener('click', () => {
  const originalData = arrayInfoArea.value;

  const [isValid, result] = Validator.validate(originalData);

  if (isValid) {
    const beautifiedOriginalData = beautify(originalData, {
      indent_size: 2
    });

    arrayInfoArea.value = beautifiedOriginalData;
    
    renderer.render(result as ValidatedData);
    mouseInfo.style.display = 'block';
  } else {
    alert(result);
  }
});

// Set initial value and trigger click event.
arrayInfoArea.value = "['Hello', 'World!']";

renderBtn.click();
