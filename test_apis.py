import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # Greenhouse list
        res = await client.get("https://boards-api.greenhouse.io/v1/boards/openai/jobs")
        print("Greenhouse List:", res.status_code)
        if res.status_code == 200:
            jobs = res.json().get("jobs", [])
            if jobs:
                job_id = jobs[0]["id"]
                # Greenhouse detail
                res2 = await client.get(f"https://boards-api.greenhouse.io/v1/boards/openai/jobs/{job_id}")
                print("Greenhouse Detail:", res2.status_code)

        # Ashby list
        res3 = await client.get("https://api.ashbyhq.com/posting-api/job-board/reddit?includeCompensation=true")
        print("Ashby List:", res3.status_code)
        if res3.status_code == 200:
            jobs = res3.json().get("jobs", [])
            if jobs:
                job_url = jobs[0]["jobUrl"]
                print("Ashby Job URL:", job_url)

if __name__ == "__main__":
    asyncio.run(test())
