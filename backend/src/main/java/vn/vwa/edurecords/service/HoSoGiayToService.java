package vn.vwa.edurecords.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.request.HoSoGiayToRequest;
import vn.vwa.edurecords.dto.response.HoSoGiayToListItem;
import vn.vwa.edurecords.dto.response.HoSoGiayToResponse;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.entity.HoSoGiayTo;
import vn.vwa.edurecords.entity.LoaiGiayTo;
import vn.vwa.edurecords.entity.LichSuNop;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.repository.HoSoGiayToRepository;
import vn.vwa.edurecords.repository.LichSuNopRepository;
import vn.vwa.edurecords.repository.LoaiGiayToRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class HoSoGiayToService {

    private final HoSoGiayToRepository hoSoGiayToRepository;
    private final LoaiGiayToRepository loaiGiayToRepository;
    private final LichSuNopRepository lichSuNopRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private int sequenceCounter = 0;

    public HoSoGiayToService(HoSoGiayToRepository hoSoGiayToRepository,
                             LoaiGiayToRepository loaiGiayToRepository,
                             LichSuNopRepository lichSuNopRepository) {
        this.hoSoGiayToRepository = hoSoGiayToRepository;
        this.loaiGiayToRepository = loaiGiayToRepository;
        this.lichSuNopRepository = lichSuNopRepository;
    }

    private synchronized String generateMaHoSo() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        sequenceCounter = (sequenceCounter + 1) % 100;
        return String.format("HS%s%02d", timestamp, sequenceCounter);
    }

    private synchronized String generateMaLog() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        sequenceCounter = (sequenceCounter + 1) % 100;
        return String.format("LSN%s%02d", timestamp, sequenceCounter);
    }

    // ===== BASIC CRUD METHODS =====

    public List<HoSoGiayTo> getByMssv(String mssv) {
        return hoSoGiayToRepository.findByMssv(mssv);
    }

    /**
     * Tra ve danh sach HoSoGiayToResponse da map them tenGiayTo tu LoaiGiayTo.
     */
    public List<HoSoGiayToResponse> getByMssvAsResponse(String mssv) {
        return hoSoGiayToRepository.findByMssv(mssv).stream()
                .map(this::toResponse)
                .toList();
    }

    private HoSoGiayToResponse toResponse(HoSoGiayTo entity) {
        HoSoGiayToResponse r = new HoSoGiayToResponse();
        r.setMaHoSo(entity.getMaHoSo());
        r.setMssv(entity.getMssv());
        r.setMaLoai(entity.getMaLoai());
        r.setTrangThaiNop(entity.getTrangThaiNop());
        r.setBanGocBanSao(entity.getBanGocBanSao());
        r.setViTriLuuKho(entity.getViTriLuuKho());
        r.setNgayTao(entity.getNgayTao());
        // JOIN tenGiayTo tu LoaiGiayTo
        if (entity.getMaLoai() != null) {
            loaiGiayToRepository.findById(entity.getMaLoai())
                    .ifPresent(loai -> r.setTenGiayTo(loai.getTenGiayTo()));
        }
        return r;
    }

    public Optional<HoSoGiayTo> getByMaHoSo(String maHoSo) {
        return hoSoGiayToRepository.findById(maHoSo);
    }

    public Optional<HoSoGiayTo> getByMssvAndMaLoai(String mssv, String maLoai) {
        return hoSoGiayToRepository.findByMssvAndMaLoai(mssv, maLoai);
    }

    public long countByMssv(String mssv) {
        return hoSoGiayToRepository.countByMssv(mssv);
    }

    // ===== SEARCH & PAGINATION =====

    /**
     * Tim kiem ho so giay to phang (kem thong tin sinh vien) cho bang
     * "Danh sach ho so giay to" tren frontend.
     *
     * <p>Cac filter deu la AND; tat ca optional. Filter rong tra tat ca.</p>
     *
     * <p>Sap xep mac dinh: ngay_tao DESC, mssv ASC, ma_loai ASC -
     * ho so moi nhat len dau; trong cung 1 SV sap theo ma loai.</p>
     *
     * <p>PostgreSQL ENUM (trang_thai_nop, trang_thai_hoc_vu)
     * duoc cast sang text de so sanh voi tham so String trong query.</p>
     *
     * @param keyword     chuoi tim tren MSSV hoac ho ten (LIKE, khong phan biet hoa)
     * @param maLoai      loc theo ma loai giay to (GT01..GT13)
     * @param trangThaiNop loc theo trang thai nop (Chua nop / Da nop / Thieu / Khong hop le)
     * @param nganhId     loc theo id nganh cua sinh vien
     * @param lopId       loc theo id lop cua sinh vien
     * @param khoaHocId   loc theo id khoa hoc cua sinh vien
     * @param trangThaiHocVu loc theo trang thai hoc vu (Dang hoc, Bao luu, ...)
     * @param page        0-based
     * @param size        kich thuoc trang
     */
    public PagedResponse<List<HoSoGiayToListItem>> searchList(
            String keyword, String maLoai, String trangThaiNop,
            Integer nganhId, Integer lopId, Integer khoaHocId, String trangThaiHocVu,
            int page, int size) {

        // Build WHERE clause + params dynamically.
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (keyword != null && !keyword.isBlank()) {
            where.append(" AND ( LOWER(hsg.mssv) LIKE LOWER(CONCAT('%', ?, '%')) "
                    + "OR LOWER(sv.ho_ten) LIKE LOWER(CONCAT('%', ?, '%')) ) ");
            params.add(keyword.trim());
            params.add(keyword.trim());
        }
        if (maLoai != null && !maLoai.isBlank()) {
            where.append(" AND hsg.ma_loai = ? ");
            params.add(maLoai.trim());
        }
        if (trangThaiNop != null && !trangThaiNop.isBlank()) {
            where.append(" AND hsg.trang_thai_nop = CAST(? AS trangthainop) ");
            params.add(trangThaiNop.trim());
        }
        if (nganhId != null) {
            where.append(" AND sv.nganh_id = ? ");
            params.add(nganhId);
        }
        if (lopId != null) {
            where.append(" AND sv.lop_id = ? ");
            params.add(lopId);
        }
        if (khoaHocId != null) {
            where.append(" AND sv.khoa_hoc_id = ? ");
            params.add(khoaHocId);
        }
        if (trangThaiHocVu != null && !trangThaiHocVu.isBlank()) {
            where.append(" AND sv.trang_thai_hoc_vu = CAST(? AS trangthaihocvu) ");
            params.add(trangThaiHocVu.trim());
        }

        // 1) Count total
        String sqlCount = "SELECT COUNT(*) FROM ho_so_giay_to hsg "
                + "JOIN sinhvien sv ON sv.mssv = hsg.mssv " + where;
        Query countQ = entityManager.createNativeQuery(sqlCount);
        for (int i = 0; i < params.size(); i++) {
            countQ.setParameter(i + 1, params.get(i));
        }
        long total = ((Number) countQ.getSingleResult()).longValue();

        // 2) Page data
        String sqlData = "SELECT "
                + "  hsg.ma_ho_so, hsg.mssv, hsg.ma_loai, "
                + "  lgt.ten_giay_to, lgt.bat_buoc, "
                + "  hsg.trang_thai_nop::text, hsg.ban_goc_ban_sao::text, "
                + "  hsg.file_dinh_kem, hsg.vi_tri_luu_kho, "
                + "  sv.ho_ten, n.ten_nganh, l.ten_lop, kh.ten_khoa_hoc, "
                + "  sv.trang_thai_hoc_vu::text, "
                + "  hsg.ngay_tao, hsg.ngay_cap_nhat "
                + "FROM ho_so_giay_to hsg "
                + "JOIN sinhvien sv       ON sv.mssv = hsg.mssv "
                + "JOIN loai_giay_to lgt  ON lgt.ma_loai = hsg.ma_loai "
                + "JOIN nganh n           ON n.id = sv.nganh_id "
                + "JOIN lop l             ON l.id = sv.lop_id "
                + "JOIN khoa_hoc kh       ON kh.id = sv.khoa_hoc_id "
                + where
                + " ORDER BY hsg.ngay_tao DESC, sv.mssv ASC, hsg.ma_loai ASC "
                + " LIMIT ? OFFSET ? ";
        Query dataQ = entityManager.createNativeQuery(sqlData);
        for (int i = 0; i < params.size(); i++) {
            dataQ.setParameter(i + 1, params.get(i));
        }
        dataQ.setParameter(params.size() + 1, size);
        dataQ.setParameter(params.size() + 2, page * size);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = dataQ.getResultList();
        List<HoSoGiayToListItem> items = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            HoSoGiayToListItem item = new HoSoGiayToListItem();
            item.setMaHoSo((String) r[0]);
            item.setMssv((String) r[1]);
            item.setMaLoai((String) r[2]);
            item.setTenLoai((String) r[3]);
            item.setLoaiBatBuoc((Boolean) r[4]);
            item.setTrangThaiNop((String) r[5]);
            item.setBanGocBanSao((String) r[6]);
            item.setFileDinhKem((String) r[7]);
            item.setViTriLuuKho((String) r[8]);
            item.setHoTen((String) r[9]);
            item.setTenNganh((String) r[10]);
            item.setTenLop((String) r[11]);
            item.setTenKhoa((String) r[12]);
            item.setTrangThaiHocVu((String) r[13]);
            // pg timestamp to java.sql.Timestamp to LocalDateTime
            if (r[14] != null) {
                item.setNgayTao(r[14] instanceof java.sql.Timestamp ts
                        ? ts.toLocalDateTime() : (LocalDateTime) r[14]);
            }
            if (r[15] != null) {
                item.setNgayCapNhat(r[15] instanceof java.sql.Timestamp ts
                        ? ts.toLocalDateTime() : (LocalDateTime) r[15]);
            }
            items.add(item);
        }

        PagedResponse.PageMetadata meta =
                new PagedResponse.PageMetadata(page, size, total);
        return new PagedResponse<>(items, meta);
    }

    // ===== CRUD OPERATIONS =====

    @Transactional
    public HoSoGiayTo create(String mssv, String maLoai, HoSoGiayToRequest request, String nguoiThucHien) {
        LoaiGiayTo loaiGiayTo = loaiGiayToRepository.findById(maLoai)
                .orElseThrow(() -> new ResourceNotFoundException("NOT_FOUND", "Loai giay to khong ton tai: " + maLoai));

        if (hoSoGiayToRepository.findByMssvAndMaLoai(mssv, maLoai).isPresent()) {
            throw new BadRequestException("EXISTS", "Ho so giay to da ton tai cho sinh vien nay");
        }

        HoSoGiayTo hoSo = new HoSoGiayTo();
        hoSo.setMaHoSo(generateMaHoSo());
        hoSo.setMssv(mssv);
        hoSo.setMaLoai(maLoai);
        hoSo.setTrangThaiNop(request.getTrangThaiNop() != null ? request.getTrangThaiNop() : "Chưa nộp");
        hoSo.setBanGocBanSao(request.getBanGocBanSao());
        hoSo.setFileDinhKem(request.getFileDinhKem());
        hoSo.setViTriLuuKho(request.getViTriLuuKho());
        hoSo.setNgayTao(LocalDateTime.now());
        hoSo.setNgayCapNhat(LocalDateTime.now());

        HoSoGiayTo saved = hoSoGiayToRepository.save(hoSo);

        ghiLichSuNop(saved, null, saved.getTrangThaiNop(), "Tao ho so", request.getGhiChu(), nguoiThucHien);

        return saved;
    }

    @Transactional
    public HoSoGiayTo update(String maHoSo, HoSoGiayToRequest request, String nguoiThucHien) {
        HoSoGiayTo hoSo = hoSoGiayToRepository.findById(maHoSo)
                .orElseThrow(() -> new ResourceNotFoundException("NOT_FOUND", "Ho so giay to khong ton tai: " + maHoSo));

        String trangThaiCu = hoSo.getTrangThaiNop();
        boolean daThayDoiTrangThai = false;

        if (request.getTrangThaiNop() != null && !request.getTrangThaiNop().equals(trangThaiCu)) {
            hoSo.setTrangThaiNop(request.getTrangThaiNop());
            daThayDoiTrangThai = true;
        }

        if (request.getBanGocBanSao() != null) {
            hoSo.setBanGocBanSao(request.getBanGocBanSao());
        }
        if (request.getFileDinhKem() != null) {
            hoSo.setFileDinhKem(request.getFileDinhKem());
        }
        if (request.getViTriLuuKho() != null) {
            hoSo.setViTriLuuKho(request.getViTriLuuKho());
        }

        hoSo.setNgayCapNhat(LocalDateTime.now());
        HoSoGiayTo updated = hoSoGiayToRepository.save(hoSo);

        if (daThayDoiTrangThai) {
            String hanhDong = xacDinhHanhDong(trangThaiCu, request.getTrangThaiNop());
            ghiLichSuNop(updated, trangThaiCu, request.getTrangThaiNop(), hanhDong, request.getGhiChu(), nguoiThucHien);
        }

        return updated;
    }

    @Transactional
    public HoSoGiayTo capNhatTrangThaiNop(String maHoSo, String trangThaiMoi, String ghiChu, String nguoiThucHien) {
        HoSoGiayTo hoSo = hoSoGiayToRepository.findById(maHoSo)
                .orElseThrow(() -> new ResourceNotFoundException("NOT_FOUND", "Ho so giay to khong ton tai: " + maHoSo));

        String trangThaiCu = hoSo.getTrangThaiNop();

        if (trangThaiMoi.equals(trangThaiCu)) {
            return hoSo;
        }

        hoSo.setTrangThaiNop(trangThaiMoi);
        hoSo.setNgayCapNhat(LocalDateTime.now());
        HoSoGiayTo updated = hoSoGiayToRepository.save(hoSo);

        String hanhDong = xacDinhHanhDong(trangThaiCu, trangThaiMoi);
        ghiLichSuNop(updated, trangThaiCu, trangThaiMoi, hanhDong, ghiChu, nguoiThucHien);

        return updated;
    }

    @Transactional
    public void delete(String maHoSo) {
        if (!hoSoGiayToRepository.existsById(maHoSo)) {
            throw new ResourceNotFoundException("NOT_FOUND", "Ho so giay to khong ton tai: " + maHoSo);
        }
        hoSoGiayToRepository.deleteById(maHoSo);
    }

    // ===== HELPER METHODS =====

    private void ghiLichSuNop(HoSoGiayTo hoSo, String trangThaiCu, String trangThaiMoi,
                              String hanhDong, String ghiChu, String nguoiThucHien) {
        LichSuNop log = new LichSuNop();
        log.setMaLog(generateMaLog());
        log.setMaHoSo(hoSo.getMaHoSo());
        log.setMssv(hoSo.getMssv());
        log.setHanhDong(hanhDong);
        log.setTrangThaiCu(trangThaiCu);
        log.setTrangThaiMoi(trangThaiMoi);
        log.setGhiChu(ghiChu);
        log.setNguoiThucHien(nguoiThucHien);
        log.setThoiGian(LocalDateTime.now());

        lichSuNopRepository.save(log);
    }

    /**
     * Xác định nhãn hành động ghi vào {@code lich_su_nop} dựa trên cặp
     * (trạng thái cũ, trạng thái mới). Giá trị trạng thái phải khớp với
     * ENUM {@code trangthainop} trong DB: {@code Chưa nộp}, {@code Đã nộp},
     * {@code Thiếu}, {@code Không hợp lệ}.
     */
    private String xacDinhHanhDong(String trangThaiCu, String trangThaiMoi) {
        if ("Chưa nộp".equals(trangThaiCu) && "Đã nộp".equals(trangThaiMoi)) {
            return "Nộp giấy tờ";
        } else if ("Đã nộp".equals(trangThaiCu) && "Chưa nộp".equals(trangThaiMoi)) {
            return "Hủy nộp";
        } else if ("Đã nộp".equals(trangThaiCu) && "Thiếu".equals(trangThaiMoi)) {
            return "Đánh dấu thiếu";
        } else if ("Thiếu".equals(trangThaiCu) && "Đã nộp".equals(trangThaiMoi)) {
            return "Bổ sung đầy đủ";
        } else if ("Đã nộp".equals(trangThaiCu) && "Không hợp lệ".equals(trangThaiMoi)) {
            return "Đánh dấu không hợp lệ";
        } else if ("Không hợp lệ".equals(trangThaiCu) && "Đã nộp".equals(trangThaiMoi)) {
            return "Hợp lệ trở lại";
        }
        return "Cập nhật trạng thái";
    }
}
