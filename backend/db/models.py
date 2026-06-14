"""SQLAlchemy models for the recipe database.

Schema overview:
    recipes ────┬──< ingredients
                ├──< steps
                ├──< recipe_tags >── tags
                └──< recipe_appliances >── appliances

Many-to-many relationships (tags, appliances) use junction tables
so the same tag/appliance row is shared across many recipes.
"""

from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, Table, Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# Junction tables for many-to-many relationships.
recipe_tags = Table(
    "recipe_tags", Base.metadata,
    Column("recipe_id", ForeignKey("recipes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

recipe_appliances = Table(
    "recipe_appliances", Base.metadata,
    Column("recipe_id", ForeignKey("recipes.id", ondelete="CASCADE"), primary_key=True),
    Column("appliance_id", ForeignKey("appliances.id", ondelete="CASCADE"), primary_key=True),
)


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False, unique=True)
    cuisine = Column(String, nullable=False, index=True)
    servings = Column(Integer, nullable=False)
    calories_per_serving = Column(Integer, nullable=False, index=True)
    prep_minutes = Column(Integer, nullable=False)

    # Denormalized cost columns: cheaper to query than summing ingredients each time.
    total_cost_gbp = Column(Float, nullable=False, index=True)
    cost_per_serving_gbp = Column(Float, nullable=False, index=True)

    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")
    steps = relationship("Step", back_populates="recipe", cascade="all, delete-orphan", order_by="Step.position")
    tags = relationship("Tag", secondary=recipe_tags, back_populates="recipes")
    appliances = relationship("Appliance", secondary=recipe_appliances, back_populates="recipes")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)
    grams = Column(Float, nullable=False)
    est_price_gbp = Column(Float, nullable=False)

    recipe = relationship("Recipe", back_populates="ingredients")


class Step(Base):
    __tablename__ = "steps"

    id = Column(Integer, primary_key=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)  # 1, 2, 3...
    content = Column(String, nullable=False)

    recipe = relationship("Recipe", back_populates="steps")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True, index=True)

    recipes = relationship("Recipe", secondary=recipe_tags, back_populates="tags")


class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True, index=True)

    recipes = relationship("Recipe", secondary=recipe_appliances, back_populates="appliances")


# Composite index for the planner's most common query shape:
# "vegetarian recipes under £X per serving, sorted by cost"
Index("idx_recipes_cost_calories", Recipe.cost_per_serving_gbp, Recipe.calories_per_serving)