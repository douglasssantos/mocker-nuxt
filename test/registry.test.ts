import {describe,it,expect} from 'vitest'
import {MockRegistry} from '../src/runtime/server/core/MockRegistry.js'
const mock=(name:string,route:string)=>({name,route,method:'GET' as const,strategy:'static' as const,response:{status:200,body:null}})
describe('MockRegistry',()=>{
 it('matches',()=>{const r=new MockRegistry();r.register([{file:'one',definitions:mock('a','/api/:id')}]);expect(r.resolve('GET','/api/8')?.params).toEqual({id:'8'})})
 it('rejects ambiguity',()=>{const r=new MockRegistry();expect(()=>r.register([{file:'a',definitions:mock('a','/api/:id')},{file:'b',definitions:mock('b','/api/orders')}])).toThrow(/Ambiguous/)})
 it('lists mapped routes',()=>{const r=new MockRegistry();r.register([{file:'mocks/a.mock.ts',definitions:mock('a','/api/purchases')}]);expect(r.list()).toMatchObject([{file:'mocks/a.mock.ts',name:'a',route:'/api/purchases',method:'GET',strategy:'static',enabled:true}])})
 it('isolates the same path on different targets',()=>{
  const r=new MockRegistry()
  const external=(name:string,target:string)=>({name,route:'/purchases',method:'GET' as const,strategy:'static' as const,target,response:{status:200,body:{source:target}}})
  r.register([{file:'a',definitions:external('ext','purchase-api')},{file:'b',definitions:external('other','other-api')}])
  expect(r.resolve('GET','/purchases')).toBeNull()
  expect(r.resolve('GET','/purchases','purchase-api')?.definition.response.body).toEqual({source:'purchase-api'})
  expect(r.resolve('GET','/purchases','other-api')?.definition.response.body).toEqual({source:'other-api'})
 })
})
