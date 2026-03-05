export const promiseWithResolvers = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((tmpResolve, tmpReject) => {
    resolve = tmpResolve;
    reject = tmpReject;
  });

  return { promise, resolve, reject };
};
