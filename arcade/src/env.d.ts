/// <reference types="astro/client" />

declare module "*?url" {
  const url: string;
  export default url;
}

declare module "*/wasm/fluid/gen/fluid.mjs" {
  interface FluidModuleOverrides {
    locateFile?: (path: string) => string;
    stdin?: () => number | null;
    print?: (line: string) => void;
    printErr?: (line: string) => void;
  }
  interface FluidModule {
    callMain: (args: string[]) => void;
  }
  export default function createFluidModule(overrides: FluidModuleOverrides): Promise<FluidModule>;
}
