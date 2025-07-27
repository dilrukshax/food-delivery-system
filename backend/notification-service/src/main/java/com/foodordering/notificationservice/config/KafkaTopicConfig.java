package com.foodordering.notificationservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Value("${kafka.topic.order-created}")
    private String orderCreatedTopic;

    @Value("${kafka.topic.order-status-changed}")
    private String orderStatusChangedTopic;

    @Value("${kafka.topic.delivery-assigned}")
    private String deliveryAssignedTopic;

    @Value("${kafka.topic.delivery-status-changed}")
    private String deliveryStatusChangedTopic;

    @Bean
    public NewTopic orderCreatedTopic() {
        return TopicBuilder.name(orderCreatedTopic)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic orderStatusChangedTopic() {
        return TopicBuilder.name(orderStatusChangedTopic)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic deliveryAssignedTopic() {
        return TopicBuilder.name(deliveryAssignedTopic)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic deliveryStatusChangedTopic() {
        return TopicBuilder.name(deliveryStatusChangedTopic)
                .partitions(1)
                .replicas(1)
                .build();
    }
}
