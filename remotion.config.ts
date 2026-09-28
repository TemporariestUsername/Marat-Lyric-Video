import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
// bt709 = limited-range yuv420p; the default tags JPEG frames as full-range
// yuvj420p, which Safari/iOS and many in-app players refuse to play.
Config.setColorSpace("bt709");
Config.setCrf(18);
Config.setConcurrency(4);
