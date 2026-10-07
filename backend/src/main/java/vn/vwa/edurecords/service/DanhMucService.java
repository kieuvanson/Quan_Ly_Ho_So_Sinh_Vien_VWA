package vn.vwa.edurecords.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.entity.Khoa;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.Lop;
import vn.vwa.edurecords.entity.Nganh;
import vn.vwa.edurecords.repository.KhoaHocRepository;
import vn.vwa.edurecords.repository.KhoaRepository;
import vn.vwa.edurecords.repository.LopRepository;
import vn.vwa.edurecords.repository.NganhRepository;

import java.util.List;
import java.util.Optional;

/**
 * Service dùng chung cho các danh mục: Khoa, Ngành, Khóa học, Lớp.
 *
 * <h3>Hai chế độ dùng</h3>
 * <ul>
 *   <li><b>Lookup theo id</b> — controller truyền id thẳng (ưu tiên, nhanh).</li>
 *   <li><b>Lookup theo tên/mã</b> — import Excel vẫn ghi text, service này map
 *       text sang entity. Nếu chưa tồn tại thì tự tạo (cascade import).</li>
 * </ul>
 *
 * <h3>Quy tắc</h3>
 * <ul>
 *   <li>Mã tự sinh theo pattern {@code KHOAxx} / {@code NGANHxxx} / {@code KHxx}
 *       / {@code LOPxxx} để tránh trùng mã do seed tay.</li>
 *   <li>Lookup theo tên dùng {@code IgnoreCase} + {@code TRIM} để chịu được
 *       dữ liệu Excel có khoảng trắng thừa hoặc khác hoa thường.</li>
 *   <li>Lookup {@code Nganh} cần biết {@code khoa} (định danh logic). Lookup
 *       {@code Lop} cần biết {@code nganh} + {@code khoaHoc}.</li>
 * </ul>
 */
@Service
public class DanhMucService {

    private final KhoaRepository khoaRepository;
    private final NganhRepository nganhRepository;
    private final KhoaHocRepository khoaHocRepository;
    private final LopRepository lopRepository;

    public DanhMucService(KhoaRepository khoaRepository,
                          NganhRepository nganhRepository,
                          KhoaHocRepository khoaHocRepository,
                          LopRepository lopRepository) {
        this.khoaRepository = khoaRepository;
        this.nganhRepository = nganhRepository;
        this.khoaHocRepository = khoaHocRepository;
        this.lopRepository = lopRepository;
    }

    // ====================== LIST (cho dropdown) ======================

    @Transactional(readOnly = true)
    public List<Khoa> listKhoa() {
        return khoaRepository.findByDangSuDungTrueOrderByTenKhoaAsc();
    }

    @Transactional(readOnly = true)
    public List<Nganh> listNganh() {
        return nganhRepository.findByDangSuDungTrueOrderByTenNganhAsc();
    }

    @Transactional(readOnly = true)
    public List<Nganh> listNganhByKhoa(Integer khoaId) {
        if (khoaId == null) return listNganh();
        return nganhRepository.findByKhoa_IdAndDangSuDungTrueOrderByTenNganhAsc(khoaId);
    }

    @Transactional(readOnly = true)
    public List<KhoaHoc> listKhoaHoc() {
        return khoaHocRepository.findByDangSuDungTrueOrderByTenKhoaHocAsc();
    }

    @Transactional(readOnly = true)
    public List<Lop> listLop() {
        return lopRepository.findByDangSuDungTrueOrderByTenLopAsc();
    }

    @Transactional(readOnly = true)
    public List<Lop> listLopByNganh(Integer nganhId) {
        if (nganhId == null) return listLop();
        return lopRepository.findByNganh_IdAndDangSuDungTrueOrderByTenLopAsc(nganhId);
    }

    // ====================== LOOKUP THEO TÊN/MÃ ======================

    @Transactional
    public Optional<Khoa> findOrCreateKhoaByTen(String tenKhoa) {
        if (tenKhoa == null) return Optional.empty();
        String ten = tenKhoa.trim();
        if (ten.isEmpty()) return Optional.empty();
        Optional<Khoa> existed = khoaRepository.findByTenKhoaIgnoreCase(ten);
        if (existed.isPresent()) return existed;
        Khoa k = new Khoa();
        k.setMaKhoa(generateMaKhoa());
        k.setTenKhoa(ten);
        return Optional.of(khoaRepository.save(k));
    }

    @Transactional
    public Optional<Nganh> findOrCreateNganhByTen(String tenNganh, Khoa khoa) {
        if (tenNganh == null || khoa == null) return Optional.empty();
        String ten = tenNganh.trim();
        if (ten.isEmpty()) return Optional.empty();
        Optional<Nganh> existed = nganhRepository
                .findFirstByTenNganhIgnoreCaseAndKhoa_Id(ten, khoa.getId());
        if (existed.isPresent()) return existed;
        Nganh n = new Nganh();
        n.setMaNganh(generateMaNganh());
        n.setTenNganh(ten);
        n.setKhoa(khoa);
        return Optional.of(nganhRepository.save(n));
    }

    @Transactional
    public Optional<KhoaHoc> findOrCreateKhoaHocByTen(String tenKhoaHoc) {
        if (tenKhoaHoc == null) return Optional.empty();
        String ten = tenKhoaHoc.trim();
        if (ten.isEmpty()) return Optional.empty();
        Optional<KhoaHoc> existed = khoaHocRepository.findByTenKhoaHocIgnoreCase(ten);
        if (existed.isPresent()) return existed;
        KhoaHoc kh = new KhoaHoc();
        kh.setMaKhoaHoc(generateMaKhoaHoc());
        kh.setTenKhoaHoc(ten);
        return Optional.of(khoaHocRepository.save(kh));
    }

    @Transactional
    public Optional<Lop> findOrCreateLopByTen(String tenLop, Nganh nganh, KhoaHoc khoaHoc) {
        if (tenLop == null || nganh == null || khoaHoc == null) return Optional.empty();
        String ten = tenLop.trim();
        if (ten.isEmpty()) return Optional.empty();
        Optional<Lop> existed = lopRepository
                .findFirstByTenLopIgnoreCaseAndNganh_IdAndKhoaHoc_Id(ten, nganh.getId(), khoaHoc.getId());
        if (existed.isPresent()) return existed;
        Lop l = new Lop();
        l.setMaLop(generateMaLop());
        l.setTenLop(ten);
        l.setNganh(nganh);
        l.setKhoaHoc(khoaHoc);
        return Optional.of(lopRepository.save(l));
    }

    // ====================== RESOLVE TEXT → ID (cho filter) ======================

    /**
     * Nhận {@code String} (id dạng số / mã / tên) → trả về {@code Integer id}
     * hoặc {@code null} nếu không tìm thấy / input rỗng.
     */
    @Transactional(readOnly = true)
    public Integer resolveKhoaId(String input) {
        if (input == null || input.isBlank()) return null;
        String s = input.trim();
        // 1) Thử id
        try {
            Integer id = Integer.parseInt(s);
            if (khoaRepository.existsById(id)) return id;
        } catch (NumberFormatException ignore) { /* không phải số */ }
        // 2) Thử mã
        Optional<Khoa> byMa = khoaRepository.findByMaKhoa(s);
        if (byMa.isPresent()) return byMa.get().getId();
        // 3) Thử tên
        Optional<Khoa> byTen = khoaRepository.findByTenKhoaIgnoreCase(s);
        return byTen.map(Khoa::getId).orElse(null);
    }

    @Transactional(readOnly = true)
    public Integer resolveKhoaHocId(String input) {
        if (input == null || input.isBlank()) return null;
        String s = input.trim();
        try {
            Integer id = Integer.parseInt(s);
            if (khoaHocRepository.existsById(id)) return id;
        } catch (NumberFormatException ignore) { /* */ }
        Optional<KhoaHoc> byMa = khoaHocRepository.findByMaKhoaHoc(s);
        if (byMa.isPresent()) return byMa.get().getId();
        Optional<KhoaHoc> byTen = khoaHocRepository.findByTenKhoaHocIgnoreCase(s);
        return byTen.map(KhoaHoc::getId).orElse(null);
    }

    /**
     * Resolve {@code nganh}: nếu biết {@code khoaId} thì lookup theo
     * {@code (ten, khoaId)} — chính xác khi 2 khoa cùng tên ngành.
     */
    @Transactional(readOnly = true)
    public Integer resolveNganhId(String input, Integer khoaId) {
        if (input == null || input.isBlank()) return null;
        String s = input.trim();
        try {
            Integer id = Integer.parseInt(s);
            if (nganhRepository.existsById(id)) return id;
        } catch (NumberFormatException ignore) { /* */ }
        Optional<Nganh> byMa = nganhRepository.findByMaNganh(s);
        if (byMa.isPresent()) return byMa.get().getId();
        if (khoaId != null) {
            Optional<Nganh> byTenKhoa = nganhRepository
                    .findFirstByTenNganhIgnoreCaseAndKhoa_Id(s, khoaId);
            if (byTenKhoa.isPresent()) return byTenKhoa.get().getId();
        }
        // Fallback: tìm theo tên (lấy record đầu tiên)
        return nganhRepository.findAll().stream()
                .filter(n -> n.getTenNganh() != null
                        && n.getTenNganh().equalsIgnoreCase(s))
                .findFirst()
                .map(Nganh::getId)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Integer resolveLopId(String input, Integer nganhId, Integer khoaHocId) {
        if (input == null || input.isBlank()) return null;
        String s = input.trim();
        try {
            Integer id = Integer.parseInt(s);
            if (lopRepository.existsById(id)) return id;
        } catch (NumberFormatException ignore) { /* */ }
        Optional<Lop> byMa = lopRepository.findByMaLop(s);
        if (byMa.isPresent()) return byMa.get().getId();
        if (nganhId != null && khoaHocId != null) {
            Optional<Lop> byAll = lopRepository
                    .findFirstByTenLopIgnoreCaseAndNganh_IdAndKhoaHoc_Id(s, nganhId, khoaHocId);
            if (byAll.isPresent()) return byAll.get().getId();
        }
        return lopRepository.findAll().stream()
                .filter(l -> l.getTenLop() != null
                        && l.getTenLop().equalsIgnoreCase(s))
                .findFirst()
                .map(Lop::getId)
                .orElse(null);
    }

    // ====================== SINH MÃ TỰ ĐỘNG ======================

    /**
     * Sinh mã khoa {@code KHOAxx} dựa trên MAX(st) + 1 (không phải count()+1).
     *
     * <p>Trước đây dùng {@code count()+1} nhưng có 2 lỗi:
     * <ul>
     *   <li>Record bị xóa → count giảm → count+1 có thể trùng mã cũ.</li>
     *   <li>Concurrent insert → hai thread cùng nhìn count=5 → cùng sinh KHOA06.</li>
     * </ul>
     *
     * <p>MAX+1 cũng không triệtám race condition hoàn toàn (vẫn có thể
     * concurrent insert cùng MAX=5 → cùng sinh KHOA06), nhưng nếu race xảy
     * ra DB sẽ ném {@code DataIntegrityViolationException} từ UNIQUE
     * constraint (đã có ở V4). Service retry tối đa 5 lần bằng cách gọi
     * lại MAX+1 mỗi lần.
     *
     * <p>Nếu sau 5 lần vẫn fail → throw để caller xử lý (vd controller trả
     * HTTP 500 hoặc fallback sang UUID).
     */
    private String generateMaKhoa() {
        return generateWithRetry(5, () -> {
            int max = khoaRepository.findMaxMaKhoaSequence();
            return "KHOA" + String.format("%02d", max + 1);
        });
    }

    private String generateMaNganh() {
        return generateWithRetry(5, () -> {
            int max = nganhRepository.findMaxMaNganhSequence();
            return "NGANH" + String.format("%03d", max + 1);
        });
    }

    private String generateMaKhoaHoc() {
        return generateWithRetry(5, () -> {
            int max = khoaHocRepository.findMaxMaKhoaHocSequence();
            return "KH" + String.format("%02d", max + 1);
        });
    }

    private String generateMaLop() {
        return generateWithRetry(5, () -> {
            int max = lopRepository.findMaxMaLopSequence();
            return "LOP" + String.format("%03d", max + 1);
        });
    }

    /**
     * Gọi {@code supplier} tối đa {@code maxRetries} lần. Bắt
     * {@link org.springframework.dao.DataIntegrityViolationException}
     * (UNIQUE constraint violation) để retry khi race condition.
     */
    private String generateWithRetry(int maxRetries, java.util.function.Supplier<String> supplier) {
        org.springframework.dao.DataIntegrityViolationException last = null;
        for (int i = 0; i < maxRetries; i++) {
            try {
                return supplier.get();
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                last = e;
                // tiếp tục retry — lần sau MAX sẽ tăng
            }
        }
        throw last != null ? last
                : new IllegalStateException("Không thể sinh mã tự động sau " + maxRetries + " lần");
    }
}
