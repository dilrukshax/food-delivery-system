package com.foodordering.restaurantservice.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.models.BlobHttpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class AzureStorageService {

    private final BlobServiceClient blobServiceClient;
    private final String restaurantContainerName;
    private final String menuItemContainerName;

    public AzureStorageService(
            BlobServiceClient blobServiceClient,
            @Value("${azure.storage.restaurant-container-name}") String restaurantContainerName,
            @Value("${azure.storage.menu-item-container-name}") String menuItemContainerName) {
        this.blobServiceClient = blobServiceClient;
        this.restaurantContainerName = restaurantContainerName;
        this.menuItemContainerName = menuItemContainerName;
    }

    public String uploadRestaurantImage(MultipartFile file) throws IOException {
        return uploadFile(file, restaurantContainerName);
    }

    public String uploadMenuItemImage(MultipartFile file) throws IOException {
        return uploadFile(file, menuItemContainerName);
    }

    private String uploadFile(MultipartFile file, String containerName) throws IOException {
        // Get container client (create if it doesn't exist)
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        if (!containerClient.exists()) {
            containerClient.create();
        }

        // Generate unique name
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String blobName = UUID.randomUUID().toString() + extension;

        // Get blob client and set content type
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        BlobHttpHeaders headers = new BlobHttpHeaders()
                .setContentType(file.getContentType());

        // Upload file
        blobClient.upload(file.getInputStream(), file.getSize(), true);
        blobClient.setHttpHeaders(headers);

        // Return URL
        return blobClient.getBlobUrl();
    }

    public void deleteFile(String blobUrl) {
        if (blobUrl == null || blobUrl.isEmpty()) {
            return;
        }

        try {
            // Extract blob name from URL
            String blobName = blobUrl.substring(blobUrl.lastIndexOf("/") + 1);
            String containerName = determineContainerNameFromUrl(blobUrl);

            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            if (blobClient.exists()) {
                blobClient.delete();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from Azure storage", e);
        }
    }

    private String determineContainerNameFromUrl(String blobUrl) {
        // Extract container name from URL
        // Example URL: https://accountname.blob.core.windows.net/container-name/blob-name
        String[] parts = blobUrl.split("/");
        for (int i = 0; i < parts.length; i++) {
            if (parts[i].equals("blob.core.windows.net") && i + 1 < parts.length) {
                return parts[i + 1];
            }
        }
        throw new RuntimeException("Could not determine container name from URL: " + blobUrl);
    }
}
