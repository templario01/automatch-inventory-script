## Deploy CronJobs kubernetes Infrastructure
Execute commands in numerical order:

1. Locate on `infra/` directory:
    ```bash
    $ cd infra
    ```

1. Create Namespace via `.yaml`:
    ```bash
    $ kubectl apply -f namespace.yaml
    ```

1. Create Secret via `CLI` and set database secret:
    ```bash
    $ kubectl create secret generic automatch-secrets \
        --from-literal=database='{database-url}' -n automatch-cluster
    ```

1. Create Configmap via `.yaml`:
    ```bash
    $ kubectl apply -f configmap.yaml
    ```
1. Create CronJob via `.yaml`:
    ```bash
    $ kubectl apply -f cronjob.yaml
    ```
1. Verify all K8 resorces where created successfully via `CLI`:
    ```bash
    $ kubectl get all,configmap,secret -n automatch-cluster
    ```
    ![jobs k8 resources](assets/jobs-k8-resources.png)
