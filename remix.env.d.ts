/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

declare module "*.css" {
  const stylesheet: string;
  export default stylesheet;
}