import { Mat } from "./Mat";
import {
  InputArray,
  KeyPoint,
  OutputArray,
  InputArrayOfArrays,
  OutputArrayOfArrays,
  FileNode,
  FileStorage
} from "./_hacks";
import { Algorithm } from "./Algorithm";

export declare class ORB extends Algorithm {
  public constructor();

  public getEdgeThreshold(): number;

  public getEdgeThreshold(): number;

  public getFastThreshold(): number;

  public getFirstLevel(): number;

  public getMaxFeatures(): number;

  public getNLevels(): number;

  public getPatchSize(): number;

  public getScaleFactor(): number;

  public getScoreType(): number;

  public getWTA_K(): number;

  public setEdgeThreshold(edgeThreshold: number): number;

  public setFastThreshold(fastThreshold: number): void;

  public setFirstLevel(firstLevel: number): void;

  public setMaxFeatures(maxFeatures: number): void;

  public setNLevels(nlevels: number): void;

  public setPatchSize(patchSize: number): void;

  public setScaleFactor(scaleFactor: number): void;

  public setScoreType(scoreType: number): void;

  public setWTA_K(wta_k: number): void;

  public compute(
    image: InputArray,
    keypoints: Array<KeyPoint>,
    descriptors: OutputArray
  ): void;

  public compute(
    images: InputArrayOfArrays,
    keypoints: Array<Array<KeyPoint>>,
    descriptors: OutputArrayOfArrays
  ): void;

  public defaultNorm(): number;

  public descriptorSize(): number;

  public descriptorType(): number;

  public detect(
    image: InputArray,
    keypoints: Array<KeyPoint>,
    mask?: InputArray
  ): number;

  public detect(
    images: InputArrayOfArrays,
    keypoints: Array<Array<KeyPoint>>,
    masks?: InputArrayOfArrays
  ): number;

  public detectAndCompute(
    image: InputArray,
    mask: InputArrayOfArrays,
    keypoints: Array<KeyPoint>,
    descriptors: OutputArray,
    useProvidedKeypoints?: boolean
  ): number;

  public empty(): boolean;

  public read(fileName: string): void;

  public read(fn: FileNode): void;

  public write(fileName: string): void;

  public write(fs: FileStorage): void;
}
