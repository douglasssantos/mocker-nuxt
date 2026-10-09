import { describe,it,expect } from 'vitest'
import { RouteMatcher } from '../src/runtime/server/core/RouteMatcher.js'
describe('RouteMatcher',()=>{
 it('extracts parameters',()=>expect(RouteMatcher.match('/api/purchases/:id','/api/purchases/42')).toEqual({id:'42'}))
 it('rejects mismatch',()=>expect(RouteMatcher.match('/api/purchases/:id','/api/customers/42')).toBeNull())
 it('normalizes slashes',()=>expect(RouteMatcher.normalize('/api/test/')).toBe('/api/test'))
})
