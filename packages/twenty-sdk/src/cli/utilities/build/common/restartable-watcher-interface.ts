import { type FileFolder } from 'twenty-shared/types';
import { type Location } from 'esbuild';

export type OnFileBuiltCallback = (options: {
  fileFolder: FileFolder;
  builtPath: string;
  sourcePath: string;
  checksum: string;
  usesSdkClient?: boolean;
}) => void | Promise<void>;

export type OnBuildErrorCallback = (
  errors: { error: string; location: Location | null }[],
) => void | Promise<void>;

export type RestartableWatcherOptions = {
  appPath: string;
  sourcePaths: string[];
  watch?: boolean;
  handleFileBuilt: OnFileBuiltCallback;
  handleBuildError: OnBuildErrorCallback;
};
