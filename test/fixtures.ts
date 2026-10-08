import { PexelsAPIImage, PexelsAPIVideo, PexelsVideoFile } from "../lib/types";

export const photo: PexelsAPIImage = {
  id: 2014422,
  width: 3024,
  height: 3024,
  url: "https://www.pexels.com/photo/brown-rocks-during-golden-hour-2014422/",
  photographer: "Joey Farina",
  photographer_url: "https://www.pexels.com/@joey",
  photographer_id: 680589,
  avg_color: "#978E82",
  src: {
    original: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg",
    large2x:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    large:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    medium:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&h=350",
    small:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&h=130",
    portrait:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    landscape:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tiny:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280",
  },
  alt: "Brown Rocks During Golden Hour",
};

export const videoFile = (overrides: Partial<PexelsVideoFile>): PexelsVideoFile => ({
  id: 1,
  quality: "sd",
  file_type: "video/mp4",
  width: 640,
  height: 360,
  fps: 25,
  link: "https://videos.pexels.com/video-files/1/sd.mp4",
  ...overrides,
});

export const video: PexelsAPIVideo = {
  id: 1448735,
  width: 4096,
  height: 2160,
  url: "https://www.pexels.com/video/video-of-forest-1448735/",
  image: "https://images.pexels.com/videos/1448735/free-video-1448735.jpg",
  duration: 32,
  user: {
    id: 574687,
    name: "Ruvim Miksanskiy",
    url: "https://www.pexels.com/@digitech",
  },
  video_files: [
    videoFile({ id: 1, quality: "sd", width: 640, height: 338 }),
    videoFile({ id: 2, quality: "hd", width: 1920, height: 1012, link: "https://videos.pexels.com/video-files/1448735/hd-1920.mp4" }),
    videoFile({ id: 3, quality: "hd", width: 1280, height: 676 }),
  ],
  video_pictures: [],
};

export function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}
