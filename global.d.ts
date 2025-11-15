declare module '*.css';

declare module 'gsap' {
  export const gsap: any;
  export default gsap;
}

declare module 'ogl' {
  export type Renderer = any;
  export const Renderer: any;
  export type Program = any;
  export const Program: any;
  export type Mesh = any;
  export const Mesh: any;
  export type Color = any;
  export const Color: any;
  export type Triangle = any;
  export const Triangle: any;
}
