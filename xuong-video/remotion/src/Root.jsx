import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import data from "./data.json";
export const Root = () => (
  <Composition id="Short" component={Video} durationInFrames={data.total} fps={data.fps} width={1080} height={1920} />
);
