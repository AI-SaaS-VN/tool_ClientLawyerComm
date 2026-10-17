import type { RegistryProvider } from "./interface";

// Fake provider for development and tests: deterministic inline HTML in the
// exact shape the parser expects (labels must stay the real Vietnamese ones).
const FAKE_DETAIL_PATH = "/0000000001-cong-ty-tnhh-sample-viet-nam";

const SEARCH_HTML = `<div class="tax-listing">
<hr />
<div data-prefetch='${FAKE_DETAIL_PATH}'>
<h3><a href='${FAKE_DETAIL_PATH}' title='Tra cuu'>CONG TY TNHH SAMPLE (VIET NAM)</a></h3>
<div>
<i class='fa fa-hashtag'></i> Mã số thuế: <a href='${FAKE_DETAIL_PATH}'>0000000001</a><br />
<i class='fa fa-user'></i> Người đại diện: <em><a href='#'>NGUYEN VAN A</a></em>
</div>
<address><i class='fa fa-map-marker'></i>  1 Duong TS5, Bac Ninh, Viet Nam</address>
</div>
</div>`;

const DETAIL_HTML = `<table class="table-taxinfo">
<thead><tr><th colspan="2" itemprop="name"><span class="copy">CONG TY TNHH SAMPLE (VIET NAM)</span></th></tr></thead>
<tbody>
<tr><td><i class='fa fa-hashtag'></i> Mã số thuế</td><td itemprop='taxID'><span class='copy'>0000000001</span></td></tr>
<tr><td><i class='fa fa-map-marker'></i> Địa chỉ</td><td itemprop='address'><span class='copy'>1 Duong TS5, Bac Ninh, Viet Nam</span></td></tr>
<tr><td><i class='fa fa-info'></i> Tình trạng</td><td>Đang hoạt động</td></tr>
<tr><td><i class='fa fa-user'></i> Người đại diện</td><td><span itemprop='name'><a href='#'>NGUYEN VAN A</a></span></td></tr>
</tbody>
</table>`;

export const fakeRegistryProvider: RegistryProvider = {
  id: "fake",
  async searchByName(name: string): Promise<string> {
    // A name that cannot match anything returns an empty listing, so tests can
    // drive the no_match path without network access.
    if (name.toLocaleLowerCase().includes("zzz-no-such-company")) {
      return '<div class="tax-listing"></div>';
    }
    return SEARCH_HTML;
  },
  async fetchDetail(): Promise<string> {
    return DETAIL_HTML;
  },
};
