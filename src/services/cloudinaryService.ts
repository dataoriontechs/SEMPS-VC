/**
 * Cloudinary Service - Interface with the secure server-side upload proxy
 */

export const cloudinaryService = {
  /**
   * Uploads an image (file object or base64 string) to Cloudinary via server proxy
   * @param fileData File object or base64 data URL string
   * @returns Promise resolving to the secure URL of the uploaded image
   */
  uploadImage: async (fileData: File | string): Promise<string> => {
    try {
      let base64Data = "";

      if (fileData instanceof File) {
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(fileData);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
      } else {
        base64Data = fileData;
      }

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file: base64Data }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao fazer upload da imagem.");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload service error:", error);
      throw error;
    }
  },

  /**
   * Deletes an image from Cloudinary using its secure URL or public ID
   * @param imageUrl The full image URL or public ID
   */
  deleteImage: async (imageUrl: string): Promise<void> => {
    try {
      // Extract public_id from the URL if a full URL is passed
      let publicId = imageUrl;
      if (imageUrl.includes("res.cloudinary.com")) {
        const parts = imageUrl.split("/");
        const lastPart = parts[parts.length - 1];
        // Remove extension (e.g., .jpg, .png)
        publicId = lastPart.substring(0, lastPart.lastIndexOf(".")) || lastPart;
      }

      const response = await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_id: publicId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao deletar imagem.");
      }
    } catch (error) {
      console.error("Cloudinary delete service error:", error);
      // Fail silently to avoid blocking user flow on deletion issues
    }
  }
};
