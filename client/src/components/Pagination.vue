<template>
  <div v-if="pagination.totalPages > 1" class="pagination">
    <button
      class="pagination-btn"
      :disabled="pagination.page <= 1"
      @click="changePage(pagination.page - 1)"
    >
      上一页
    </button>
    <button
      v-for="page in displayPages"
      :key="page"
      class="pagination-btn"
      :class="{ active: page === pagination.page }"
      @click="changePage(page)"
    >
      {{ page }}
    </button>
    <button
      class="pagination-btn"
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
