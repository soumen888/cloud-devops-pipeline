output "vpc_id" {
  description = "The ID of the custom VPC"
  value       = aws_vpc.main.id
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "ec2_public_ip" {
  description = "Public IP address of the deployed EC2 instance"
  value       = aws_instance.web.public_ip
}

output "app_url" {
  description = "Direct URL to access the deployed web application"
  value       = "http://${aws_instance.web.public_ip}:3000"
}

output "health_check_url" {
  description = "Health check URL for monitoring"
  value       = "http://${aws_instance.web.public_ip}:3000/healthz"
}

