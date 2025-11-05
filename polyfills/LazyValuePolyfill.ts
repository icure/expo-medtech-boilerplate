// Based on react-native polyfil global
export function defineLazyObjectProperty<T>(
  object: object,
  name: string,
  get: () => T,
): void {
  let value: T;
  let valueSet = false;
  function getValue(): T {
    if (!valueSet) {
      valueSet = true;
      setValue(get());
    }
    return value;
  }
  function setValue(newValue: T): void {
    value = newValue;
    valueSet = true;
    Object.defineProperty(object, name, {
      value: newValue,
      configurable: true,
    })
  }

  Object.defineProperty(object, name, {
    get: getValue,
    set: setValue,
    configurable: true
  })
}