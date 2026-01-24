/**
 * 分页组件 - 智能显示分页按钮
 * 逻辑: 有几页就显示几页，超过5页时显示省略号
 */
import './pagination.scss'

interface PaginationProps {
  /** 当前页码 */
  page: number
  /** 总页数 */
  totalPages: number
  /** 页码变更回调 */
  onPageChange: (page: number) => void
  /** 是否显示首尾按钮 */
  showFirstLast?: boolean
  /** 自定义样式类名 */
  className?: string
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  showFirstLast = true,
  className = '',
}: PaginationProps) {
  // 如果总页数为1，不显示分页
  if (totalPages <= 1) {
    return null
  }

  /**
   * 生成要显示的页码数组
   * 规则:
   * - 总页数 <= 5: 显示全部页码
   * - 总页数 > 5: 显示 [1, ..., page-1, page, page+1, ..., totalPages]
   */
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []

    if (totalPages <= 5) {
      // 页数少于等于5，直接显示所有页码
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // 页数超过5时的逻辑
    const startPage = Math.max(1, page - 2)
    const endPage = Math.min(totalPages, page + 2)

    // 添加首页
    pages.push(1)

    // 如果第2页不在范围内，添加省略号
    if (startPage > 2) {
      pages.push('...')
    }

    // 添加中间页码
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i)
      }
    }

    // 如果倒数第2页不在范围内，添加省略号
    if (endPage < totalPages - 1) {
      pages.push('...')
    }

    // 添加末页
    pages.push(totalPages)

    // 移除重复项
    return pages.filter((p, i) => i === 0 || p !== pages[i - 1])
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav className={`pagination-wrapper ${className}`}>
      {/* 上一页按钮 */}
      <button
        type="button"
        className="pagination-btn pagination-prev"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        title="Previous page"
        aria-label="Previous page"
      >
        Prev
      </button>

      {/* 首页按钮 */}
      {showFirstLast && page > 3 && (
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(1)}
          title="First page"
          aria-label="First page"
        >
          «
        </button>
      )}

      {/* 页码按钮组 */}
      <div className="pagination-numbers">
        {pageNumbers.map((pageNum) => {
          if (pageNum === '...') {
            return (
              <span key="ellipsis" className="pagination-ellipsis">
                ...
              </span>
            )
          }

          const num = pageNum as number
          return (
            <button
              key={num}
              type="button"
              className={`pagination-btn pagination-number ${
                num === page ? 'active' : ''
              }`}
              onClick={() => onPageChange(num)}
              aria-current={num === page ? 'page' : undefined}
              aria-label={`Page ${num}`}
            >
              {num}
            </button>
          )
        })}
      </div>

      {/* 末页按钮 */}
      {showFirstLast && page < totalPages - 2 && (
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(totalPages)}
          title="Last page"
          aria-label="Last page"
        >
          »
        </button>
      )}

      {/* 下一页按钮 */}
      <button
        type="button"
        className="pagination-btn pagination-next"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        title="Next page"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  )
}
