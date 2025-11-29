import { FC, ReactNode, Suspense, lazy, type LazyExoticComponent } from 'react';

/**
 * 组件懒加载，结合Suspense实现
 * @param Component 组件对象
 * @returns 返回新组件
 */
export const LazyLoad = (Component: FC): ReactNode => {
  return (
    // fallback的loading效果可自行修改为ui组件库的loading组件或骨架屏等等
    <Suspense fallback={<div className="route-loading"></div>}>
      <Component />
    </Suspense>
  );
};

/**
 * Create a lazy component with fallback in case the import fails (e.g., dev server 500 or module missing)
 */
export function lazyWithFallback(importer: () => Promise<any>): LazyExoticComponent<any> {
  return lazy(() => importer().catch(async (e: any) => {
    console.error('[lazyWithFallback] failed to import module', e)
    // try to fetch the importer url to read its body for better error message (dev only)
    try {
      // importer function won't reveal the url easily; we make a best-effort to find module path from stack
      if (typeof window !== 'undefined' && e && e.stack) {
        console.warn('[lazyWithFallback] import error stack trace: ', e.stack)
      }
    } catch (_err) {
      // ignore
    }
    return { default: () => <div className="route-error">Failed to load page</div> }
  }))
}
