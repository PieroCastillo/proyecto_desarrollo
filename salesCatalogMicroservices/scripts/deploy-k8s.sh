#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="sales-catalog"
CLUSTER_NAME="sales-catalog"
MODE="deploy"
SKIP_BUILD="false"
PORT_FORWARD="false"

usage() {
  cat <<EOF
Usage: ./scripts/deploy-k8s.sh [options]

Options:
  --namespace <name>    Kubernetes namespace. Default: sales-catalog
  --cluster-name <name> Kind cluster name. Default: sales-catalog
  --rerun              Re-apply Kubernetes files without rebuilding images
  --rebuild            Rebuild/reload service images and restart app pods
  --skip-build         Do not build or load Docker images
  --port-forward       Forward api-gateway to http://localhost:8080/api
  -h, --help           Show this help

Default behavior creates/reuses the Kind cluster, builds images, applies Kubernetes files,
and waits for rollouts. It preserves the cluster, namespace, Mongo PVC, and Docker images.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --namespace)
      NAMESPACE="${2:?Missing value for --namespace}"
      shift 2
      ;;
    --cluster-name)
      CLUSTER_NAME="${2:?Missing value for --cluster-name}"
      shift 2
      ;;
    --rerun)
      MODE="rerun"
      SKIP_BUILD="true"
      shift
      ;;
    --rebuild)
      MODE="rebuild"
      SKIP_BUILD="false"
      shift
      ;;
    --skip-build)
      SKIP_BUILD="true"
      shift
      ;;
    --port-forward)
      PORT_FORWARD="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

IMAGES=(
  "auth-service:$ROOT_DIR/auth-service"
  "catalog-service:$ROOT_DIR/catalog-service"
  "orders-service:$ROOT_DIR/orders-service"
  "api-gateway:$ROOT_DIR/api-gateway"
)

run() {
  echo ">> $*"
  "$@"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

require_command kubectl
require_command kind

ensure_kind_cluster() {
  if kind get clusters 2>/dev/null | grep -qx "$CLUSTER_NAME"; then
    echo "Kind cluster '$CLUSTER_NAME' already exists. Reusing it."
  else
    require_command docker
    echo "Creating Kind cluster '$CLUSTER_NAME'..."
    run kind create cluster --name "$CLUSTER_NAME" --config "$ROOT_DIR/k8s/kind-config.yaml"
  fi

  run kubectl config use-context "kind-$CLUSTER_NAME"
}

load_images_into_kind() {
  for image in "${IMAGES[@]}"; do
    name="${image%%:*}"
    run kind load docker-image "sales-catalog/$name:local" --name "$CLUSTER_NAME"
  done
}

restart_app_deployments() {
  run kubectl rollout restart deployment/auth-service -n "$NAMESPACE"
  run kubectl rollout restart deployment/catalog-service -n "$NAMESPACE"
  run kubectl rollout restart deployment/orders-service -n "$NAMESPACE"
  run kubectl rollout restart deployment/api-gateway -n "$NAMESPACE"
}

ensure_kind_cluster

if [[ "$SKIP_BUILD" == "false" ]]; then
  require_command docker

  for image in "${IMAGES[@]}"; do
    name="${image%%:*}"
    path="${image#*:}"
    run docker build -t "sales-catalog/$name:local" "$path"
  done

  load_images_into_kind
fi

run kubectl apply -k "$ROOT_DIR/k8s"

if [[ "$MODE" == "rebuild" ]]; then
  restart_app_deployments
fi

run kubectl rollout status deployment/mongo -n "$NAMESPACE"
run kubectl rollout status deployment/auth-service -n "$NAMESPACE"
run kubectl rollout status deployment/catalog-service -n "$NAMESPACE"
run kubectl rollout status deployment/orders-service -n "$NAMESPACE"
run kubectl rollout status deployment/api-gateway -n "$NAMESPACE"

echo
echo "API Gateway inside the cluster: http://api-gateway.$NAMESPACE.svc.cluster.local:8080/api"
echo "NodePort configured: http://localhost:30080/api if your Kubernetes exposes NodePorts on localhost."

if [[ "$PORT_FORWARD" == "true" ]]; then
  echo "Opening port-forward at http://localhost:8080/api ..."
  run kubectl port-forward -n "$NAMESPACE" service/api-gateway 8080:8080
fi
