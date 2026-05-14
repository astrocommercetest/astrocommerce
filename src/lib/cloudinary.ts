export const cloudinaryImagePath = (
  transformations: string,
  publicId?: string | null,
) => {
  return `https://res.cloudinary.com/${import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId || "product-placeholder_obkmrq"}.jpg`;
};
