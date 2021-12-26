import { NestedArray } from '../types';

export type AvailableValue = number | string | null | undefined;

export type ValidatedData = NestedArray<AvailableValue>;

type ValidationResult = [boolean, string | ValidatedData];

export default class Validator {
  public static validate(data: string): ValidationResult {
    try {
      const parsedData = eval(data);

      if (!Array.isArray(parsedData)) {
        return [false, 'Data should be array.'];
      }

      if (parsedData.length < 1) {
        return [false, 'Data should not be empty.'];
      }

      if (!this.checkIsAvailableValuesInData(parsedData)) {
        return [false, "Data should contain only 'Number', 'String', 'Null', and 'Undefined'."];
      }

      return [true, parsedData]
    } catch(e) {
      return [false, 'Cannot parse string.'];
    }
  }

  private static checkIsAvailableValuesInData(parsedData: NestedArray<any>) {
    let isAvailable = true;

    (function _checkIsAvailableValuesInData(data: NestedArray<any>) {
      for (const value of data) {
        if (Array.isArray(value)) {
          _checkIsAvailableValuesInData(value);
        } else if (
          !(
            value == null ||
            (typeof value === 'number' && !Number.isNaN(value)) ||
            typeof value === 'string'
          )
        ) {
          isAvailable = false;
          break;
        }
      }  
    })(parsedData);

    return isAvailable;
  }
}
