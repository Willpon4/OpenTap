"""
Create the initial superadmin user for OpenTap.

Usage:
    python -m scripts.seed_admin --email admin@opentap.org --password changeme --name "Admin"
"""

import argparse
import asyncio
from sqlalchemy import select
from app.core.database import engine, async_session, init_db
from app.core.auth import hash_password
from app.models.supporting import AdminUser


async def create_admin(email: str, password: str, name: str):
    await init_db()

    async with async_session() as db:
        # Check if user already exists
        result = await db.execute(select(AdminUser).where(AdminUser.email == email))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"Admin user already exists: {email}")
            return

        user = AdminUser(
            email=email,
            password_hash=hash_password(password),
            name=name,
            role="superadmin",
            city_id=None,  # superadmin sees everything
        )
        db.add(user)
        await db.commit()
        print(f"Created superadmin: {email}")
        print(f"User ID: {user.id}")


def main():
    parser = argparse.ArgumentParser(description="Create initial OpenTap admin")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--name", required=True)
    args = parser.parse_args()

    asyncio.run(create_admin(args.email, args.password, args.name))


if __name__ == "__main__":
    main()
