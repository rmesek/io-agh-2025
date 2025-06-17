# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "requests",
# ]
# ///

import requests
import time

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_USERNAME = "admin@example.com"
ADMIN_PASSWORD = "changethis"

STUDENTS = [
    {
        "email": "student1@example.com",
        "full_name": "Adam Student",
        "study_stage": "bachelor",
        "year_of_study": 3,
        "department": "Wydział Infomatyki",
        "user_id": None,
    },
    {
        "email": "student2@example.com",
        "full_name": "Piotr Student",
        "study_stage": "bachelor",
        "year_of_study": 3,
        "department": "Wydział Infomatyki",
        "user_id": None,
    },
    {
        "email": "student3@example.com",
        "full_name": "Krzysztof Student",
        "study_stage": "bachelor",
        "year_of_study": 3,
        "department": "Wydział Elektroniki",
        "user_id": None,
    },
    {
        "email": "student4@example.com",
        "full_name": "Tomasz Student",
        "study_stage": "bachelor",
        "year_of_study": 3,
        "department": "Wydział Elektroniki",
        "user_id": None,
    },
    {
        "email": "student5@example.com",
        "full_name": "Zuzanna Student",
        "study_stage": "master",
        "year_of_study": 5,
        "department": "Wydział Elektroniki",
        "user_id": None,
    },
    {
        "email": "student6@example.com",
        "full_name": "Anna Student",
        "study_stage": "master",
        "year_of_study": 5,
        "department": "Wydział Infomatyki",
        "user_id": None,
    },
    {
        "email": "student7@example.com",
        "full_name": "Magdalena Student",
        "study_stage": "master",
        "year_of_study": 5,
        "department": "Wydział Infomatyki",
        "user_id": None,
    },
]

PROMOTERS = [
    {
        "email": "promoter1@example.com",
        "full_name": "Jan Promotor",
        "academic_degree": "prof.",
        "can_supervise_bachelor": True,
        "can_supervise_master": True,
        "student_limit": 3,
        "department": "Wydział Infomatyki",
        "research_interests": ["Sztuczna inteligencja", "Uczenie maszynowe"],
        "user_id": None,
    },
    {
        "email": "promoter2@example.com",
        "full_name": "Michał Promotor",
        "academic_degree": "dr.",
        "can_supervise_bachelor": True,
        "can_supervise_master": True,
        "student_limit": 3,
        "department": "Wydział Elektroniki",
        "research_interests": ["Przetwarzanie sygnałów", "Telekomunikacja"],
        "user_id": None,
    },
    {
        "email": "promoter3@example.com",
        "full_name": "Joanna Promotor",
        "academic_degree": "dr.",
        "can_supervise_bachelor": True,
        "can_supervise_master": True,
        "student_limit": 3,
        "department": "Wydział Infomatyki",
        "research_interests": ["Algorytmy genetyczne", "Optymalizacja"],
        "user_id": None,
    },
    {
        "email": "promoter4@example.com",
        "full_name": "Anna Promotor",
        "academic_degree": "mgr.",
        "can_supervise_bachelor": True,
        "can_supervise_master": False,
        "student_limit": 3,
        "department": "Wydział Infomatyki",
        "research_interests": ["Analiza obrazów", "Wizja komputerowa"],
        "user_id": None,
    },
]

THESIS_TOPIC = [
    {
        "title": "Sztuczna inteligencja w rolnictwie",
        "description": "Zbadanie możliwości wykorzystania sztucznej inteligencji w optymalizacji procesów rolniczych.",
        "target_study_stage": "bachelor",
        "slots_total": 1,
        "slots_available": 1,
        "status": "open",
        "language": "Polski",
        "department": "Wydział Infomatyki",
        "keywords": ["Sztuczna inteligencja", "Rolnictwo"],
        "promoter_email": "promoter1@example.com",
    },
    {
        "title": "Sztuczna inteligencja w medycynie",
        "description": "Zastosowanie algorytmów sztucznej inteligencji w diagnostyce medycznej.",
        "target_study_stage": "bachelor",
        "slots_total": 3,
        "slots_available": 3,
        "status": "open",
        "language": "Angielski",
        "department": "Wydział Infomatyki",
        "keywords": ["Sztuczna inteligencja", "Medycyna"],
        "promoter_email": "promoter1@example.com",
    },
    {
        "title": "Analiza danych w telekomunikacji",
        "description": "Zastosowanie analizy danych w optymalizacji sieci telekomunikacyjnych.",
        "target_study_stage": "master",
        "slots_total": 1,
        "slots_available": 1,
        "status": "open",
        "language": "Polski",
        "department": "Wydział Elektroniki",
        "keywords": ["Analiza danych", "Telekomunikacja"],
        "promoter_email": "promoter2@example.com",
    },
    {
        "title": "Algorytmy genetyczne - optymalizacja problemów",
        "description": "Badanie efektywności algorytmów genetycznych w różnych problemach optymalizacyjnych.",
        "target_study_stage": "bachelor",
        "slots_total": 2,
        "slots_available": 2,
        "status": "open",
        "language": "Polski",
        "department": "Wydział Infomatyki",
        "keywords": ["Algorytmy genetyczne", "Optymalizacja"],
        "promoter_email": "promoter3@example.com",
    },
]


def get_access_token():
    """Authenticates and returns the access token."""
    login_url = f"{BASE_URL}/login/access-token"
    data = {
        "grant_type": "password",
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD,
        "scope": "",
        "client_id": "string",
        "client_secret": "string",
    }
    headers = {
        "accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    response = requests.post(login_url, data=data, headers=headers)
    response.raise_for_status()
    return response.json()["access_token"]


def get_user_id(access_token, user_email):
    users_url = f"{BASE_URL}/users/"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {access_token}",
    }
    response = requests.get(users_url, headers=headers)
    response.raise_for_status()
    users_data = response.json()

    for user_info in users_data.get("data", []):
        if user_info.get("email") == user_email:
            return user_info.get("id")
    return None


def create_user(access_token, user, role):
    url = f"{BASE_URL}/users/"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    user_data = {
        "email": user["email"],
        "is_active": True,
        "is_superuser": True,
        "full_name": user["full_name"],
        "role": role,
        "password": ADMIN_PASSWORD,
    }
    response = requests.post(url, headers=headers, json=user_data)
    if not 200 <= response.status_code < 300:
        print(f"Failed to create user {user['email']}: {response.text}")


def create_promoter(access_token, promoter):
    create_user(access_token, promoter, "promoter")
    promoter["user_id"] = get_user_id(access_token, promoter["email"])

    url = f"{BASE_URL}/promoter-profiles/"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    promoter_data = {
        "academic_degree": promoter["academic_degree"],
        "can_supervise_bachelor": promoter["can_supervise_bachelor"],
        "can_supervise_master": promoter["can_supervise_master"],
        "student_limit": promoter["student_limit"],
        "department": promoter["department"],
        "research_interests": promoter["research_interests"],
        "user_id": promoter["user_id"],
    }
    response = requests.post(url, headers=headers, json=promoter_data)
    if not 200 <= response.status_code < 300:
        print(f"Failed to create promoter {promoter['email']}: {response.text}")


def create_student(access_token, student):
    create_user(access_token, student, "student")
    student["user_id"] = get_user_id(access_token, student["email"])

    url = f"{BASE_URL}/student-profiles/"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    student_data = {
        "study_stage": student["study_stage"],
        "year_of_study": student["year_of_study"],
        "department": student["department"],
        "user_id": student["user_id"],
    }
    response = requests.post(url, headers=headers, json=student_data)
    if not 200 <= response.status_code < 300:
        print(f"Failed to create student {student['email']}: {response.text}")


def create_thesis_topic(access_token, topic):
    url = f"{BASE_URL}/thesis-topics/"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    topic_data = {
        "title": topic["title"],
        "description": topic["description"],
        "target_study_stage": topic["target_study_stage"],
        "slots_total": topic["slots_total"],
        "slots_available": topic["slots_available"],
        "status": topic["status"],
        "language": topic["language"],
        "department": topic["department"],
        "keywords": topic["keywords"],
        "promoter_id": get_user_id(access_token, topic["promoter_email"]),
    }
    response = requests.post(url, headers=headers, json=topic_data)
    if not 200 <= response.status_code < 300:
        print(f"Failed to create thesis topic {topic['title']}: {response.text}")


def main():
    print("Starting database population...")
    time.sleep(5)

    access_token = get_access_token()

    for promoter in PROMOTERS:
        create_promoter(access_token, promoter)

    for student in STUDENTS:
        create_student(access_token, student)

    for topic in THESIS_TOPIC:
        create_thesis_topic(access_token, topic)


if __name__ == "__main__":
    main()
