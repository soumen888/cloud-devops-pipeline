variable "aws_region" {
  description = "AWS region for all infrastructure resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the custom VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets across availability zones"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "instance_type" {
  description = "EC2 instance size (t2.micro and t3.micro are AWS Free-Tier eligible)"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Optional AWS EC2 Key Pair name for SSH access (leave empty if not using key pair)"
  type        = string
  default     = ""
}

