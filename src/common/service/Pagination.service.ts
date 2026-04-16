export const getPagination = (
  page?: string,
  limit?: string
): { limitNumber: number; skip: number } => {
  const pageNumber = page ? parseInt(page) : 1;
  const limitNumber = limit ? parseInt(limit) : 20;
  const skip = (pageNumber - 1) * limitNumber;

  return { limitNumber, skip };
};
