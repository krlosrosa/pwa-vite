export const convertFileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // Lê o conteúdo do arquivo
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};