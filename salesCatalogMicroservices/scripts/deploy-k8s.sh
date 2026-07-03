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
  --port-forward       Forward frontend to http://localhost:8081 and api-gateway to http://localhost:8080/api
  -h, --help           Show this help

Default behavior creates/reuses the Kind cluster, builds images, applies Kubernetes files,
and waits for rollouts. It preserves the cluster, namespace, and Docker images.
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
WORKSPACE_DIR="$(cd "$ROOT_DIR/.." && pwd)"
FRONTEND_DIR="$WORKSPACE_DIR/salesCatalogApp"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

if [[ ! -f "$ENV_FILE" && -f "$WORKSPACE_DIR/salesCatalogAppAPI/.env" ]]; then
  ENV_FILE="$WORKSPACE_DIR/salesCatalogAppAPI/.env"
fi

IMAGES=(
  "auth-service:$ROOT_DIR/auth-service"
  "catalog-service:$ROOT_DIR/catalog-service"
  "orders-service:$ROOT_DIR/orders-service"
  "api-gateway:$ROOT_DIR/api-gateway"
  "frontend:$FRONTEND_DIR"
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

read_env_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 || true)"
  line="${line#${key}=}"
  line="${line%$'\r'}"
  line="${line%\"}"
  line="${line#\"}"
  line="${line%\'}"
  line="${line#\'}"
  printf '%s' "$line"
}

load_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing environment file: $ENV_FILE" >&2
    echo "Create $ROOT_DIR/.env from .env.example with the remote MongoDB URI." >&2
    exit 1
  fi

  MONGO_URI="$(read_env_value MONGO_URI)"
  JWT_SECRET="$(read_env_value JWT_SECRET)"

  if [[ -z "${MONGO_URI:-}" ]]; then
    echo "MONGO_URI is missing in $ENV_FILE" >&2
    exit 1
  fi

  if [[ "$MONGO_URI" == *"localhost"* || "$MONGO_URI" == *"mongo:27017"* ]]; then
    echo "MONGO_URI in $ENV_FILE must point to the remote MongoDB database, not localhost or the old in-cluster Mongo service." >&2
    exit 1
  fi

  if [[ -z "${JWT_SECRET:-}" ]]; then
    echo "JWT_SECRET is missing in $ENV_FILE" >&2
    exit 1
  fi
}

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
  run kubectl rollout restart deployment/frontend -n "$NAMESPACE"
}

load_env_file
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

run kubectl apply -f "$ROOT_DIR/k8s/namespace.yaml"
echo ">> kubectl create secret generic sales-catalog-secrets --namespace $NAMESPACE --from-literal=MONGO_URI=*** --from-literal=JWT_SECRET=*** --dry-run=client -o yaml | kubectl apply -f -"
kubectl create secret generic sales-catalog-secrets \
  --namespace "$NAMESPACE" \
  --from-literal=MONGO_URI="$MONGO_URI" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --dry-run=client \
  -o yaml \
  | kubectl apply -f -

run kubectl apply -k "$ROOT_DIR/k8s"

if [[ "$MODE" == "rebuild" ]]; then
  restart_app_deployments
fi

run kubectl rollout status deployment/auth-service -n "$NAMESPACE"
run kubectl rollout status deployment/catalog-service -n "$NAMESPACE"
run kubectl rollout status deployment/orders-service -n "$NAMESPACE"
run kubectl rollout status deployment/api-gateway -n "$NAMESPACE"
run kubectl rollout status deployment/frontend -n "$NAMESPACE"

echo
echo "Frontend NodePort configured: http://localhost:30081 if your Kubernetes exposes NodePorts on localhost."
echo "API Gateway inside the cluster: http://api-gateway.$NAMESPACE.svc.cluster.local:8080/api"
echo "NodePort configured: http://localhost:30080/api if your Kubernetes exposes NodePorts on localhost."

if [[ "$PORT_FORWARD" == "true" ]]; then
  echo "Opening frontend port-forward at http://localhost:8081 ..."
  kubectl port-forward -n "$NAMESPACE" service/frontend 8081:80 &
  FRONTEND_PORT_FORWARD_PID=$!

  echo "Opening api-gateway port-forward at http://localhost:8080/api ..."
  kubectl port-forward -n "$NAMESPACE" service/api-gateway 8080:8080 &
  API_PORT_FORWARD_PID=$!

  trap 'kill "$FRONTEND_PORT_FORWARD_PID" "$API_PORT_FORWARD_PID" 2>/dev/null || true' EXIT
  wait
fi
