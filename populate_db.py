import requests

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
        "full_name": "Zuzanna Student",
        "study_stage": "master",
        "year_of_study": 5,
        "department": "Wydział Elektroniki",
        "user_id": None,
    },
    {
        "email": "student3@example.com",
        "full_name": "Piotr Student",
        "study_stage": "bachelor",
        "year_of_study": 3,
        "department": "Wydział Infomatyki",
        "user_id": None,
    },
    {
        "email": "student4@example.com",
        "full_name": "Anna Student",
        "study_stage": "master",
        "year_of_study": 5,
        "department": "Wydział Infomatyki",
        "user_id": None,
    },
    {
        "email": "student5@example.com",
        "full_name": "Krzysztof Student",
        "study_stage": "bachelor",
        "year_of_study": 3,
        "department": "Wydział Elektroniki",
        "user_id": None,
    },
    {
        "email": "student6@example.com",
        "full_name": "Magdalena Student",
        "study_stage": "master",
        "year_of_study": 5,
        "department": "Wydział Infomatyki",
        "user_id": None,
    },
    {
        "email": "student7@example.com",
        "full_name": "Tomasz Student",
        "study_stage": "bachelor",
        "year_of_study": 3,
        "department": "Wydział Elektroniki",
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
        "student_limit": 5,
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
        "student_limit": 5,
        "department": "Wydział Elektroniki",
        "research_interests": ["Przetwarzanie sygnałów", "Telekomunikacja"],
        "user_id": None,
    },
    {
        "email": "promoter3@example.com",
        "full_name": "Anna Promotor",
        "academic_degree": "mgr.",
        "can_supervise_bachelor": True,
        "can_supervise_master": False,
        "student_limit": 5,
        "department": "Wydział Infomatyki",
        "research_interests": ["Analiza obrazów", "Wizja komputerowa"],
        "user_id": None,
    },
    {
        "email": "promoter4@example.com",
        "full_name": "Joanna Promotor",
        "academic_degree": "dr.",
        "can_supervise_bachelor": True,
        "can_supervise_master": True,
        "student_limit": 5,
        "department": "Wydział Infomatyki",
        "research_interests": ["Algorytmy genetyczne", "Optymalizacja"],
        "user_id": None,
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


def get_user_id(access_token, user):
    users_url = f"{BASE_URL}/users/"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {access_token}",
    }
    response = requests.get(users_url, headers=headers)
    response.raise_for_status()
    users_data = response.json()

    for user_info in users_data.get("data", []):
        if user_info.get("email") == user["email"]:
            return user_info.get("id")
    return None


def create_user(access_token, user):
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
        "role": "student",
        "password": ADMIN_PASSWORD,
    }
    response = requests.post(url, headers=headers, json=user_data)
    if not 200 <= response.status_code < 300:
        print(f"Failed to create user {user['email']}: {response.text}")


def create_promoter(access_token, promoter):
    create_user(access_token, promoter)
    promoter["user_id"] = get_user_id(access_token, promoter)
    # TODO: Create promoter profile


def create_student(access_token, student):
    create_user(access_token, student)
    student["user_id"] = get_user_id(access_token, student)
    # TODO: Create student profile


def main():
    access_token = get_access_token()

    for promoter in PROMOTERS:
        create_promoter(access_token, promoter)

    for student in STUDENTS:
        create_student(access_token, student)

    print(*PROMOTERS, sep="\n")
    print(*STUDENTS, sep="\n")


if __name__ == "__main__":
    main()
