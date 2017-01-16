import * as Benchmark from 'benchmark';

import * as tssServerWrap from '../tsserverWrap';
import * as langService from '../languageService';

var tss = new tssServerWrap.TsserverWrapper();
var suite = new Benchmark.Suite;

suite.add('navTree with tsserver', {
    defer: true,
    fn: function(deferred){
        tss.navtree('examples/ex7_deepNesting.ts')
            .then(() => {
                deferred.resolve();
            })
    }
}).on('complete', function () {
    console.log(this[0].stats)
}).run();


suite.add('navTree with languageService', {
    defer: true,
    fn: function(deferred){
        langService.navTreeOnFile('examples/ex7_deepNesting.ts');
        deferred.resolve();
    }
}).on('complete', function () {
    console.log(this[1].stats)
}).run();
