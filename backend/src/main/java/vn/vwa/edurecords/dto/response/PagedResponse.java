package vn.vwa.edurecords.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PagedResponse<T> {

    private T data;
    private PageMetadata page;

    public PagedResponse() {}

    public PagedResponse(T data, PageMetadata page) {
        this.data = data;
        this.page = page;
    }

    public T getData() {
        return data;
    }

    public PageMetadata getPage() {
        return page;
    }

    public static class PageMetadata {
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean first;
        private boolean last;

        public PageMetadata() {}

        public PageMetadata(int page, int size, long totalElements) {
            this.page = page;
            this.size = size;
            this.totalElements = totalElements;
            this.totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
            this.first = page == 0;
            this.last = page >= totalPages - 1;
        }

        public int getPage() { return page; }
        public int getSize() { return size; }
        public long getTotalElements() { return totalElements; }
        public int getTotalPages() { return totalPages; }
        public boolean isFirst() { return first; }
        public boolean isLast() { return last; }
    }
}
