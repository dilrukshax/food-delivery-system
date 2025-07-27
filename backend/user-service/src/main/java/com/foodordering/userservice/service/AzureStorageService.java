package com.foodordering.userservice.service;

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
    private final String containerName;

    public AzureStorageService(
            BlobServiceClient blobServiceClient,
            @Value("${azure.storage.container-name}") String containerName) {
        this.blobServiceClient = blobServiceClient;
        this.containerName = containerName;
    }

    public String uploadFile(MultipartFile file) throws IOException {
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
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            if (blobClient.exists()) {
                blobClient.delete();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from Azure storage", e);
        }
    }
}
