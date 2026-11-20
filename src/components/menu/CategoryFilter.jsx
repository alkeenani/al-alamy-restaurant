import './CategoryFilter.css'

function CategoryFilter({ categories, activeCategory, onSelect }) {
  return (
    <div
      className="category-filter"
      role="group"
      aria-label="تصفية الأقسام حسب الفئة"
    >
      {categories.map((category) => {
        const unavailable = category.isAvailable === false
        return (
          <button
            key={category.id}
            type="button"
            className={`category-filter__button${unavailable ? ' category-filter__button--unavailable' : ''}`}
            aria-pressed={category.id === activeCategory}
            onClick={() => onSelect(category.id)}
          >
            <span>{category.label}</span>
            {unavailable ? <span className="category-filter__badge">غير متوفر حاليًا</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryFilter
