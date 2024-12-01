import { build as esbuild, BuildOptions, Plugin } from 'esbuild';

export interface BuildConfig {
  entryPoints?: string[];
  outdir?: string;
  plugins?: Plugin[];
  watch?: boolean;
  minify?: boolean;
  sourcemap?: boolean;
  define?: Record<string, string>;
  onBuild?: () => void | Promise<void>;
  onCleanup?: () => void | Promise<void>;
}

export class Builder {
  private config: BuildConfig;
  private buildContext: any = null;

  constructor(config: BuildConfig) {
    this.config = {
      minify: false,
      sourcemap: true,
      watch: false,
      ...config
    };
  }

  async build() {
    const buildOptions: BuildOptions = {
      entryPoints: this.config.entryPoints,
      outdir: this.config.outdir,
      bundle: true,
      minify: this.config.minify,
      sourcemap: this.config.sourcemap,
      format: 'esm',
      platform: 'browser',
      plugins: [
        this.getHMRPlugin(),
        ...(this.config.plugins || [])
      ],
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        ...this.config.define
      }
    };

    if (this.config.watch) {
      this.buildContext = await esbuild({
        ...buildOptions,
        watch: true
      } as BuildOptions);

      this.buildContext.watch().then((watchResult: any) => {
        watchResult.onRebuild((error: any, result: any) => {
          if (error) console.error('Build failed:', error);
          else console.log('Build succeeded:', result);
        });
      });
    } else {
      await esbuild(buildOptions);
    }

    if (this.config.onBuild) {
      await this.config.onBuild();
    }
  }

  private getHMRPlugin(): Plugin {
    return {
      name: 'hmr',
      setup(build) {
        build.onEnd(result => {
          if (result.errors.length > 0) {
            console.error('Build errors:', result.errors);
          }
        });
      }
    };
  }

  async stop() {
    if (this.buildContext) {
      await this.buildContext.dispose();
    }

    if (this.config.onCleanup) {
      await this.config.onCleanup();
    }
  }
}