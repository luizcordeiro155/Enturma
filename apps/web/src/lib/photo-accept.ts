"use client";
import { useEffect, useState } from "react";
import { PHOTO_ACCEPT } from "./photo-import";

/**
 * The `accept` of a photo picker. On a phone it stays "image/*", which is what opens the
 * gallery. On a computer the file window hides what it does not know as an image, so the HEIC
 * and RAW extensions are named too.
 */
export function usePhotoAccept(also = "") {
  const [computer, setComputer] = useState(false);
  useEffect(() => {
    if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
      queueMicrotask(() => setComputer(true));
  }, []);
  const [images, ...extensions] = PHOTO_ACCEPT.split(",");
  return [
    images,
    ...(also ? [also] : []),
    ...(computer ? extensions : []),
  ].join(",");
}
