import './CategoryFilter.css'

const allOption = { id: 'all', label: 'الكل' }

function CategoryFilter({ categories, activeCategory, onSelect }) {
  const options = [allOption, ...categories]

  return (
    <div
      className="category-filter"
      role="group"
      aria-label="تصفية المنتجات حسب الفئة"
    >
      {options.map((category) => (
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
