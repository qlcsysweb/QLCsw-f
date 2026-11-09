const UPLOAD_SEGMENT = '/upload/';

export const isCloudinary = (url) => typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes(UPLOAD_SEGMENT);

export function cloudinaryUrl(url, width) {
  if (!isCloudinary(url)) return url;
  return url.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}f_auto,q_auto,c_limit,w_${width}/`);
}

export function responsiveImage(url, widths = [480, 720, 1080]) {
  if (!isCloudinary(url)) return { src: url };
  return {
    src: cloudinaryUrl(url, widths[1] || widths[0]),
    srcSet: widths.map((w) => `${cloudinaryUrl(url, w)} ${w}w`).join(', '),
  };
}
