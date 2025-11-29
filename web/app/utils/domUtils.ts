/**
 * Утилиты для безопасной работы с DOM
 */

/**
 * Безопасно очищает контейнер от всех дочерних элементов
 */
export function safeClearContainer(container: HTMLElement | null): void {
  if (!container) return
  
  try {
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
  } catch (error) {
    // Если ошибка при removeChild, используем innerHTML
    container.innerHTML = ''
  }
}

/**
 * Безопасно добавляет элемент в контейнер
 */
export function safeAppendChild(container: HTMLElement | null, element: Node): boolean {
  if (!container || !element) return false
  
  try {
    container.appendChild(element)
    return true
  } catch (error) {
    console.error('Error appending child:', error)
    return false
  }
}

/**
 * Безопасно удаляет элемент из DOM
 */
export function safeRemoveElement(element: Node | null): boolean {
  if (!element || !element.parentNode) return false
  
  try {
    element.parentNode.removeChild(element)
    return true
  } catch (error) {
    console.error('Error removing element:', error)
    return false
  }
}

/**
 * Безопасно проверяет, является ли элемент дочерним
 */
export function isChildOf(child: Node | null, parent: HTMLElement | null): boolean {
  if (!child || !parent) return false
  
  try {
    return parent.contains(child)
  } catch (error) {
    console.error('Error checking child relationship:', error)
    return false
  }
}














