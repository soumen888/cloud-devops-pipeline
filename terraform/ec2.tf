# Automatically lookup latest Ubuntu 22.04 LTS AMI in the current region
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (Official Ubuntu AWS account ID)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Free-Tier Eligible EC2 Instance
resource "aws_instance" "web" {
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = var.instance_type
  subnet_id            = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  key_name             = var.key_name != "" ? var.key_name : null

  # Automated User Data script: installs Docker on first boot
  user_data = <<-EOF
              #!/bin/bash
              set -e

              # 1. Update packages and install Docker
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg lsb-release unzip

              # Install Docker official repository
              install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              chmod a+r /etc/apt/keyrings/docker.gpg

              echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
                $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

              # Enable & start Docker
              systemctl enable docker
              systemctl start docker
              usermod -aG docker ubuntu

              # 2. Install AWS CLI v2
              curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
              unzip awscliv2.zip
              ./aws/install

              echo "Docker and AWS CLI successfully installed on EC2!" > /var/log/provisioning_done.txt
              EOF

  user_data_replace_on_change = true

  tags = {
    Name = "${var.environment}-devops-server"
  }
}

