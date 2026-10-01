<template>
  <div v-if="pagination.totalPages > 1" class="pagination">
    <button
      type="button"
      class="pagination-btn pagination-nav"
      :disabled="pagination.page <= 1"
      @click="changePage(pagination.page - 1)"
    >
      上一页
    </button>

    <button
      v-for="page in displayPages"
      :key="page"
      type="button"
      class="pagination-btn"
      :class="{ active: page === pagination.page }"
      :aria-current="page === pagination.page ? 'page' : undefined"
      @click="changePage(page)"
    >
      {{ page }}
    </button>

    <button
      type="button"
      class="pagination-btn pagination-nav"
      :disabled="pagination.page >= pagination.totalPages"
      @click="changePage(pagination.page + 1)"
    >
      下一页
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getPageRange } from '@/assets/js/utils'

const props = defineProps({
  pagination: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['change'])

const displayPages = computed(() => {
  return getPageRange(props.pagination.totalPages, props.pagination.page)
})

function changePage(page) {
  emit('change', page)
}
</script>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-12);
}

.pagination-btn {
  min-width: 2.5rem;
  min-height: 2.5rem;
  padding: var(--space-2) var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--fs-caption);
  font-variant-numeric: tabular-nums;
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard),
    transform var(--dur-instant) var(--ease-standard);
}

.pagination-nav {
  padding-inline: var(--space-4);
  letter-spacing: var(--tracking-wide);
}

.pagination-btn:hover:not(:disabled):not(.active) {
  background: var(--tint-primary-weak);
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
}

.pagination-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.pagination-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary-dark);
  color: var(--on-primary);
  font-weight: var(--weight-semibold);
}

.pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
</style>
