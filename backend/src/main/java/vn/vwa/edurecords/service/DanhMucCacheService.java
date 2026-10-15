package vn.vwa.edurecords.service;

import org.springframework.stereotype.Service;
import vn.vwa.edurecords.entity.Khoa;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.LoaiGiayTo;
import vn.vwa.edurecords.entity.Lop;
import vn.vwa.edurecords.entity.Nganh;
import vn.vwa.edurecords.repository.KhoaHocRepository;
import vn.vwa.edurecords.repository.KhoaRepository;
import vn.vwa.edurecords.repository.LoaiGiayToRepository;
import vn.vwa.edurecords.repository.LopRepository;
import vn.vwa.edurecords.repository.NganhRepository;
import vn.vwa.edurecords.repository.SinhVienRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Cache các danh mục + tập MSSV tồn tại trong DB để phục vụ validate nhanh
 * khi import nhiều dòng.
 *
 * <h3>Tại sao cần cache?</h3>
 * <p>Với 10.000 dòng SV, mỗi dòng cần lookup 4 danh mục (Khoa/Ngành/Lớp/Khóa
 * học) + kiểm tra MSSV/CCCD trùng. Nếu query trực tiếp mỗi dòng → 50.000+ query
 * → chậm. Thay vào đó load toàn bộ 1 lần vào {@code Map} (HashMap O(1)) để
 * validate toàn bộ trong vài giây.</p>
 *
 * <h3>Hiệu lực</h3>
 * <p>Cache chỉ tồn tại trong 1 lần gọi /preview. Sau khi ghi xong, instance
 * cache bị giải phóng. Nếu cần cache lâu hơn → dùng Redis (chưa làm).</p>
 */
@Service
public class DanhMucCacheService {

    private final KhoaRepository khoaRepository;
    private final NganhRepository nganhRepository;
    private final KhoaHocRepository khoaHocRepository;
    private final LopRepository lopRepository;
    private final LoaiGiayToRepository loaiGiayToRepository;
    private final SinhVienRepository sinhVienRepository;

    public DanhMucCacheService(KhoaRepository khoaRepository,
                               NganhRepository nganhRepository,
                               KhoaHocRepository khoaHocRepository,
                               LopRepository lopRepository,
                               LoaiGiayToRepository loaiGiayToRepository,
                               SinhVienRepository sinhVienRepository) {
        this.khoaRepository = khoaRepository;
        this.nganhRepository = nganhRepository;
        this.khoaHocRepository = khoaHocRepository;
        this.lopRepository = lopRepository;
        this.loaiGiayToRepository = loaiGiayToRepository;
        this.sinhVienRepository = sinhVienRepository;
    }

    /**
     * Bundle cache toàn bộ danh mục cần thiết cho 1 lần import.
     * Mỗi instance là 1 snapshot tại thời điểm gọi.
     */
    public Snapshot snapshot() {
        return new Snapshot();
    }

    /**
     * Bundle các Map tra cứu nhanh.
     */
    public class Snapshot {
        private final Map<String, Khoa> khoaByTenLower;
        private final Map<String, Nganh> nganhByTenLower;
        private final Map<String, KhoaHoc> khoaHocByTenLower;
        private final Map<String, LoaiGiayTo> loaiGiayToByMa;
        private final Map<String, LoaiGiayTo> loaiGiayToByTenLower;
        private final Map<LopKey, Lop> lopByKey;
        private final Set<String> mssvExists;

        private Snapshot() {
            this.khoaByTenLower = khoaRepository.findAll().stream()
                    .filter(k -> k.getTenKhoa() != null)
                    .collect(Collectors.toMap(
                            k -> k.getTenKhoa().trim().toLowerCase(Locale.ROOT),
                            Function.identity(),
                            (a, b) -> a // duplicate -> giữ bản đầu
                    ));
            this.nganhByTenLower = nganhRepository.findAll().stream()
                    .filter(n -> n.getTenNganh() != null)
                    .collect(Collectors.toMap(
                            n -> n.getTenNganh().trim().toLowerCase(Locale.ROOT),
                            Function.identity(),
                            (a, b) -> a
                    ));
            this.khoaHocByTenLower = khoaHocRepository.findAll().stream()
                    .filter(k -> k.getTenKhoaHoc() != null)
                    .collect(Collectors.toMap(
                            k -> k.getTenKhoaHoc().trim().toLowerCase(Locale.ROOT),
                            Function.identity(),
                            (a, b) -> a
                    ));
            List<LoaiGiayTo> loaiGiayToList = loaiGiayToRepository.findAll();
            this.loaiGiayToByMa = loaiGiayToList.stream()
                    .collect(Collectors.toMap(LoaiGiayTo::getMaLoai, Function.identity(), (a, b) -> a));
            this.loaiGiayToByTenLower = loaiGiayToList.stream()
                    .filter(l -> l.getTenGiayTo() != null)
                    .collect(Collectors.toMap(
                            l -> l.getTenGiayTo().trim().toLowerCase(Locale.ROOT),
                            Function.identity(),
                            (a, b) -> a
                    ));
            this.lopByKey = new HashMap<>();
            for (Lop l : lopRepository.findAll()) {
                if (l.getTenLop() == null || l.getNganh() == null || l.getKhoaHoc() == null) continue;
                LopKey key = new LopKey(
                        l.getTenLop().trim().toLowerCase(Locale.ROOT),
                        l.getNganh().getId(),
                        l.getKhoaHoc().getId());
                lopByKey.putIfAbsent(key, l);
            }
            this.mssvExists = sinhVienRepository.findAll().stream()
                    .map(s -> s.getMssv())
                    .collect(Collectors.toSet());
        }

        public Khoa findKhoa(String tenKhoa) {
            if (tenKhoa == null) return null;
            return khoaByTenLower.get(tenKhoa.trim().toLowerCase(Locale.ROOT));
        }

        public Nganh findNganh(String tenNganh) {
            if (tenNganh == null) return null;
            return nganhByTenLower.get(tenNganh.trim().toLowerCase(Locale.ROOT));
        }

        public KhoaHoc findKhoaHoc(String tenKhoaHoc) {
            if (tenKhoaHoc == null) return null;
            return khoaHocByTenLower.get(tenKhoaHoc.trim().toLowerCase(Locale.ROOT));
        }

        public LoaiGiayTo findLoaiGiayToByMa(String maLoai) {
            if (maLoai == null) return null;
            return loaiGiayToByMa.get(maLoai.trim());
        }

        public LoaiGiayTo findLoaiGiayToByTen(String tenGiayTo) {
            if (tenGiayTo == null) return null;
            return loaiGiayToByTenLower.get(tenGiayTo.trim().toLowerCase(Locale.ROOT));
        }

        public Lop findLop(String tenLop, Integer nganhId, Integer khoaHocId) {
            if (tenLop == null || nganhId == null || khoaHocId == null) return null;
            LopKey key = new LopKey(
                    tenLop.trim().toLowerCase(Locale.ROOT), nganhId, khoaHocId);
            return lopByKey.get(key);
        }

        public boolean mssvExists(String mssv) {
            if (mssv == null) return false;
            return mssvExists.contains(mssv);
        }

        /** Kiểm tra trạng thái học vụ có hợp lệ theo ENUM DB. */
        public boolean isTrangThaiHocVu(String trangThai) {
            if (trangThai == null) return false;
            return Set.of(
                    "Đang học", "Bảo lưu", "Đình chỉ", "Tốt nghiệp", "Đã rút hồ sơ"
            ).contains(trangThai.trim());
        }

        /**
         * Khóa tra cứu Lớp theo (tên lớp, nganhId, khoaHocId).
         */
        private record LopKey(String tenLopLower, Integer nganhId, Integer khoaHocId) {}
    }
}
