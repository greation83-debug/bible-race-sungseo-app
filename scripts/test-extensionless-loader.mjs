// 시험 전용: Vite처럼 확장자 없는 src import('./x')를 './x.js'로 찾아 준다.
// 사용: node --import ./scripts/test-extensionless-loader.mjs --test scripts/year-read-count.test.mjs
import { register } from 'node:module';

register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(specifier, context, next) {
    try { return await next(specifier, context); }
    catch (e) {
        if (e && e.code === 'ERR_MODULE_NOT_FOUND' && (specifier.startsWith('.') || specifier.startsWith('/')) && !/\\.[cm]?jsx?$/.test(specifier)) {
            return next(specifier + '.js', context);
        }
        throw e;
    }
}`));
