import { useCallback, useMemo, useState } from 'react'

/**
 * Hook dùng chung để chọn nhiều sinh viên qua nhiều trang.
 *
 * Quy ước phạm vi: "lựa chọn theo phạm vi filter hiện tại".
 *  - Tất cả MSSV đã chọn được lưu trong một Set duy nhất, không phụ thuộc vào trang.
 *  - Khi filter / trang thay đổi, các MSSV đã chọn trước đó vẫn hợp lệ (nếu thuộc filter mới).
 *  - Khi cần "chọn tất cả trong filter", ta lưu snapshot danh sách MSSV hiện đang hiển thị
 *    cộng dồn với các MSSV đã chọn trước đó nếu cùng filter. Việc lấy đầy đủ các MSSV trong
 *    filter (bao gồm cả các trang chưa tải) sẽ do component gọi cung cấp (qua getAllMatchingMssv).
 */
export interface UseStudentSelectionOptions {
  /** Lấy danh sách MSSV thuộc filter hiện tại, đã hiển thị trên UI. */
  getVisibleMssv: () => string[]
  /**
   * Lấy TOÀN BỘ MSSV thuộc filter hiện tại (tất cả các trang). Component có thể gọi API
   * `getAll` với size lớn rồi trả về mảng MSSV. Nếu không cung cấp, "chọn tất cả" chỉ
   * chọn các MSSV đang hiển thị.
   */
  getAllMatchingMssv?: () => Promise<string[]> | string[]
  /**
   * Đánh dấu filter đã thay đổi. Khi filter thay đổi, ta không tự động xóa lựa chọn cũ;
   * thay vào đó, người dùng phải xác nhận lại phạm vi chọn. Tuy nhiên, MSSV không còn
   * thuộc filter mới sẽ bị loại bỏ khi gọi `pruneToFilter`.
   */
  onFilterChanged?: () => void
}

export interface UseStudentSelectionResult {
  selectedMssv: Set<string>
  selectedCount: number
  hasSelection: boolean
  toggleMssv: (mssv: string) => void
  toggleAllVisible: (visibleMssv: string[]) => void
  selectAllMatching: () => Promise<string[]>
  isSelected: (mssv: string) => boolean
  isAllVisibleSelected: (visibleMssv: string[]) => boolean
  isSomeVisibleSelected: (visibleMssv: string[]) => boolean
  clearSelection: () => void
  removeMssv: (mssvList: string[]) => void
  pruneToFilter: (validMssv: Set<string>) => void
  getSelectedArray: () => string[]
}

export function useStudentSelection(
  options: UseStudentSelectionOptions
): UseStudentSelectionResult {
  const { getVisibleMssv, getAllMatchingMssv, onFilterChanged } = options

  const [selectedMssv, setSelectedMssv] = useState<Set<string>>(new Set())

  const isSelected = useCallback(
    (mssv: string) => selectedMssv.has(mssv),
    [selectedMssv]
  )

  const toggleMssv = useCallback((mssv: string) => {
    setSelectedMssv((prev) => {
      const next = new Set(prev)
      if (next.has(mssv)) {
        next.delete(mssv)
      } else {
        next.add(mssv)
      }
      return next
    })
  }, [])

  const toggleAllVisible = useCallback((visibleMssv: string[]) => {
    setSelectedMssv((prev) => {
      const next = new Set(prev)
      const allSelected = visibleMssv.every((m) => next.has(m))
      if (allSelected && visibleMssv.length > 0) {
        // Bỏ chọn những cái đang hiển thị
        visibleMssv.forEach((m) => next.delete(m))
      } else {
        // Chọn tất cả những cái đang hiển thị
        visibleMssv.forEach((m) => next.add(m))
      }
      return next
    })
  }, [])

  const selectAllMatching = useCallback(async (): Promise<string[]> => {
    if (!getAllMatchingMssv) {
      // Fallback: chỉ chọn MSSV đang hiển thị
      const visible = getVisibleMssv()
      setSelectedMssv((prev) => {
        const next = new Set(prev)
        visible.forEach((m) => next.add(m))
        return next
      })
      return visible
    }
    const allMatching = await getAllMatchingMssv()
    setSelectedMssv((prev) => {
      const next = new Set(prev)
      allMatching.forEach((m) => next.add(m))
      return next
    })
    return allMatching
  }, [getAllMatchingMssv, getVisibleMssv])

  const isAllVisibleSelected = useCallback(
    (visibleMssv: string[]) =>
      visibleMssv.length > 0 && visibleMssv.every((m) => selectedMssv.has(m)),
    [selectedMssv]
  )

  const isSomeVisibleSelected = useCallback(
    (visibleMssv: string[]) =>
      visibleMssv.some((m) => selectedMssv.has(m)),
    [selectedMssv]
  )

  const clearSelection = useCallback(() => {
    setSelectedMssv(new Set())
    onFilterChanged?.()
  }, [onFilterChanged])

  const removeMssv = useCallback((mssvList: string[]) => {
    setSelectedMssv((prev) => {
      const next = new Set(prev)
      mssvList.forEach((m) => next.delete(m))
      return next
    })
  }, [])

  const pruneToFilter = useCallback((validMssv: Set<string>) => {
    setSelectedMssv((prev) => {
      let changed = false
      const next = new Set<string>()
      prev.forEach((m) => {
        if (validMssv.has(m)) {
          next.add(m)
        } else {
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [])

  const getSelectedArray = useCallback(
    () => Array.from(selectedMssv),
    [selectedMssv]
  )

  return useMemo(
    () => ({
      selectedMssv,
      selectedCount: selectedMssv.size,
      hasSelection: selectedMssv.size > 0,
      toggleMssv,
      toggleAllVisible,
      selectAllMatching,
      isSelected,
      isAllVisibleSelected,
      isSomeVisibleSelected,
      clearSelection,
      removeMssv,
      pruneToFilter,
      getSelectedArray,
    }),
    [
      selectedMssv,
      toggleMssv,
      toggleAllVisible,
      selectAllMatching,
      isSelected,
      isAllVisibleSelected,
      isSomeVisibleSelected,
      clearSelection,
      removeMssv,
      pruneToFilter,
      getSelectedArray,
    ]
  )
}