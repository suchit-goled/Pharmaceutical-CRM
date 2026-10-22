import time
import statistics
import concurrent.futures
from typing import List, Dict, Any
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def run_single_request(user_token: str, request_id: int) -> Dict[str, Any]:
    """
    Executes a typical representative CRM workload:
    - 60% Dashboard & HCP search (read)
    - 25% Product catalogue lookups (read)
    - 15% Detailing interaction fetch/query (read/write)
    """
    start_time = time.perf_counter()
    status_code = 0
    endpoint = ""
    headers = {
        "Authorization": f"Bearer {user_token}",
        "X-Bypass-Rate-Limit": "true"
    }
    try:
        mod = request_id % 10
        if mod < 6:
            # Dashboard / HCP search
            endpoint = "/api/hcps?page=1&page_size=10"
            res = client.get(endpoint, headers=headers)
        elif mod < 8:
            # Product catalogue
            endpoint = "/api/products"
            res = client.get(endpoint, headers=headers)
        else:
            # Interactions list
            endpoint = "/interactions?page=1&page_size=10"
            res = client.get(endpoint, headers=headers)
        
        status_code = res.status_code
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        success = (200 <= status_code < 300)
        return {
            "request_id": request_id,
            "endpoint": endpoint,
            "latency_ms": latency_ms,
            "status_code": status_code,
            "success": success
        }
    except Exception as e:
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "request_id": request_id,
            "endpoint": endpoint,
            "latency_ms": latency_ms,
            "status_code": 500,
            "success": False,
            "error": str(e)
        }

def run_load_test(total_requests: int = 500, concurrency: int = 25) -> Dict[str, Any]:
    print(f"\n=======================================================")
    print(f"STARTING HIGH-CONCURRENCY PERFORMANCE BENCHMARK")
    print(f"Total Requests: {total_requests} | Concurrency Level: {concurrency}")
    print(f"=======================================================")

    # Authenticate to obtain test session token
    login_res = client.post("/api/auth/login", json={
        "email": "rep1@medintelcrm.com",
        "password": "RepPassword123!"
    })
    token = login_res.json()["access_token"]

    start_wall_time = time.perf_counter()
    results: List[Dict[str, Any]] = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(run_single_request, token, i)
            for i in range(total_requests)
        ]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())

    total_wall_time = time.perf_counter() - start_wall_time
    latencies = [r["latency_ms"] for r in results]
    successes = [r for r in results if r["success"]]
    failures = [r for r in results if not r["success"]]

    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]
    avg_latency = statistics.mean(latencies)
    rps = total_requests / total_wall_time

    metrics = {
        "total_requests": total_requests,
        "concurrency": concurrency,
        "total_time_seconds": round(total_wall_time, 3),
        "requests_per_second": round(rps, 2),
        "success_count": len(successes),
        "failure_count": len(failures),
        "error_rate_pct": round((len(failures) / total_requests) * 100.0, 2),
        "latency_avg_ms": round(avg_latency, 2),
        "latency_p50_ms": round(p50, 2),
        "latency_p95_ms": round(p95, 2),
        "latency_p99_ms": round(p99, 2),
        "min_latency_ms": round(min(latencies), 2),
        "max_latency_ms": round(max(latencies), 2)
    }

    print("\n---------------- RESULTS ----------------")
    print(f"Throughput:       {metrics['requests_per_second']} req/sec")
    print(f"Error Rate:       {metrics['error_rate_pct']}% ({metrics['failure_count']} failed)")
    print(f"Avg Latency:      {metrics['latency_avg_ms']} ms")
    print(f"p50 Latency:      {metrics['latency_p50_ms']} ms")
    print(f"p95 Latency:      {metrics['latency_p95_ms']} ms")
    print(f"p99 Latency:      {metrics['latency_p99_ms']} ms")
    print(f"Total Duration:   {metrics['total_time_seconds']} s")
    print("-----------------------------------------\n")
    return metrics

if __name__ == "__main__":
    # Baseline benchmark
    run_load_test(total_requests=400, concurrency=20)
