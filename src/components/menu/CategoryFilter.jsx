import './CategoryFilter.css'

function CategoryFilter({ categories, activeCategory, onSelect }) {
  return (
    <div
      className="category-filter"
      role="group"
      aria-label="????? ???????? ??? ?????"
    >
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className="category-filter__button"
          aria-pressed={category.id === activeCategory}
          onClick={() => onSelect(category.id)}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}

export default CategoryFilter
