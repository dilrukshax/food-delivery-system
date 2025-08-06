# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.28"

  vpc_id                          = module.vpc.vpc_id
  subnet_ids                      = module.vpc.private_subnets
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
  }

  # EKS Managed Node Groups
  eks_managed_node_groups = {
    main = {
      name = "main-node-group"

      instance_types = [var.node_instance_type]

      min_size     = var.min_size
      max_size     = var.max_size
      desired_size = var.desired_size

      ami_type               = "AL2_x86_64"
      capacity_type          = "ON_DEMAND"

      labels = {
        Environment = var.environment
        NodeGroup   = "main"
      }

      tags = {
        Environment = var.environment
      }
    }
  }

  # aws-auth configmap
  enable_irsa = true

  tags = {
    Environment = var.environment
  }
}

# ECR Repositories
resource "aws_ecr_repository" "repos" {
  for_each = toset([
    "food-delivery/api-gateway",
    "food-delivery/user-service",
    "food-delivery/restaurant-service",
    "food-delivery/order-service",
    "food-delivery/payment-service",
    "food-delivery/delivery-service",
    "food-delivery/notification-service",
    "food-delivery/frontend"
  ])

  name                 = each.value
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Environment = var.environment
  }
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "policy" {
  for_each   = aws_ecr_repository.repos
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
